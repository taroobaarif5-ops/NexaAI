import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as multer from 'multer';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FilesService } from './files.service';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        destination: async (req, file, callback) => {
          const userId = (req as any).user?.id || 'unknown';
          const destination = path.resolve(process.cwd(), 'uploads', userId);
          await fs.mkdir(destination, { recursive: true });
          callback(null, destination);
        },
        filename: (req, file, callback) => {
          const safeBase = file.originalname.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-') || 'upload';
          callback(null, `${Date.now()}-${safeBase}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (req, file, callback) => {
        const allowed = new Set([
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

        if (!allowed.has(file.mimetype)) {
          callback(new BadRequestException('Unsupported file type.'), false);
          return;
        }

        callback(null, true);
      },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: { user: { id: string } },
  ) {
    return this.filesService.uploadFile(file, req.user.id);
  }
}
