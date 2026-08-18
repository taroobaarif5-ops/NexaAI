import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';

import { UploadedFile } from './file.entity';
import { User } from '../users/user.entity';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/webp',
]);

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(UploadedFile)
    private readonly uploadedFiles: Repository<UploadedFile>,

    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async uploadFile(file: Express.Multer.File, userId: string) {
    if (!file) {
      throw new BadRequestException('A file is required.');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File size must be 10 MB or less.');
    }

    const sanitizedOriginalName = this.sanitizeOriginalName(
      file.originalname,
    );

    const mimeType = this.normalizeMimeType(
      file.mimetype,
      sanitizedOriginalName,
    );

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new BadRequestException('Unsupported file type.');
    }

    const user = await this.users.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const safeName = this.createSafeFilename(sanitizedOriginalName);

    const userFolder = path.join(
      process.cwd(),
      'uploads',
      user.id,
    );

    await fs.mkdir(userFolder, { recursive: true });

    const absolutePath = path.join(userFolder, safeName);

    const relativePath = path
      .relative(process.cwd(), absolutePath)
      .replace(/\\/g, '/');

    await fs.writeFile(
      absolutePath,
      await fs.readFile(file.path),
      'binary',
    );

    const saved = this.uploadedFiles.create({
      name: safeName,
      originalName: sanitizedOriginalName,
      mimeType,
      size: file.size,
      relativePath,
      status: 'uploaded',
      user,
    });

    const entity = await this.uploadedFiles.save(saved);

    return {
      id: entity.id,
      name: entity.originalName,
      mimeType: entity.mimeType,
      size: entity.size,
      status: entity.status,
    };
  }

  async findForUser(fileId: string, userId: string) {
    const file = await this.uploadedFiles.findOne({
      where: {
        id: fileId,
        user: {
          id: userId,
        },
      },
      relations: {
        user: true,
      },
    });

    if (!file) {
      throw new NotFoundException('File not found.');
    }

    return file;
  }

  async buildAttachmentContext(
    userId: string,
    attachment?: {
      id?: string;
      mimeType?: string;
      name?: string;
    },
  ) {
    if (!attachment?.id) {
      return null;
    }

    const file = await this.findForUser(
      attachment.id,
      userId,
    );

    if (file.mimeType.startsWith('image/')) {
      throw new BadRequestException(
        'Image analysis is not available yet in this browser/runtime.',
      );
    }

    const extractedText = await this.extractText(file);

    if (!extractedText) {
      throw new BadRequestException(
        'This file type is not supported for AI analysis yet.',
      );
    }

    const trimmedText = extractedText
      .slice(0, 9000)
      .trim();

    return `Attached file: "${file.originalName}"\n\nExtracted text:\n${trimmedText}`;
  }

  async extractText(file: UploadedFile) {
    const absolutePath = path.resolve(
      process.cwd(),
      file.relativePath,
    );

    const relative = path.relative(
      process.cwd(),
      absolutePath,
    );

    if (
      relative.startsWith('..') ||
      path.isAbsolute(relative)
    ) {
      throw new BadRequestException(
        'Invalid file path.',
      );
    }

    const buffer = await fs.readFile(absolutePath);

    /*
     * Plain text / CSV
     */
    if (
      file.mimeType === 'text/plain' ||
      file.name.toLowerCase().endsWith('.txt') ||
      file.name.toLowerCase().endsWith('.csv')
    ) {
      return buffer.toString('utf-8');
    }

    /*
     * PDF
     *
     * pdf-parse is loaded lazily here instead of at application
     * startup. This prevents Vercel from crashing while importing
     * the PDF rendering dependencies during function initialization.
     */
    if (
      file.mimeType === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf')
    ) {
      const { PDFParse } = await import('pdf-parse');

      const parser = new PDFParse({
        data: buffer,
      });

      try {
        const result = await parser.getText();

        return result.text || '';
      } finally {
        await parser.destroy();
      }
    }

    /*
     * DOCX
     */
    if (
      file.mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.toLowerCase().endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({
        buffer,
      });

      return result.value || '';
    }

    /*
     * Excel / XLSX / XLS
     */
    if (
      file.mimeType === 'application/vnd.ms-excel' ||
      file.mimeType ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.name.toLowerCase().endsWith('.xlsx') ||
      file.name.toLowerCase().endsWith('.xls')
    ) {
      const workbook = XLSX.read(buffer, {
        type: 'buffer',
      });

      const rows: string[] = [];

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];

        const json = XLSX.utils.sheet_to_json<
          Record<string, unknown>
        >(worksheet, {
          raw: false,
          defval: '',
        });

        rows.push(
          `Sheet: ${sheetName}\n${JSON.stringify(
            json.slice(0, 20),
            null,
            2,
          )}`,
        );
      }

      return rows.join('\n\n');
    }

    return null;
  }

  private sanitizeOriginalName(originalName: string) {
    return (
      originalName
        .replace(/[\\/]+/g, '')
        .trim() || 'upload'
    );
  }

  private normalizeMimeType(
    mimeType: string,
    originalName: string,
  ) {
    const value = mimeType.toLowerCase();

    const ext = path
      .extname(originalName)
      .toLowerCase();

    const map: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.docx':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xlsx':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls': 'application/vnd.ms-excel',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
    };

    return map[ext] || value;
  }

  private createSafeFilename(fileName: string) {
    const ext = path
      .extname(fileName)
      .toLowerCase();

    const safeBase =
      path
        .basename(fileName, ext)
        .replace(/[^a-zA-Z0-9._-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'document';

    return `${Date.now()}-${safeBase}${ext}`;
  }
}