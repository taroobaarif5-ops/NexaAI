import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

const LEGACY_USER_ID = '00000000-0000-4000-8000-000000000001';
const LEGACY_EMAIL = 'legacy-data@nexora.local';

@Injectable()
export class DatabaseMigrationService implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    const tables = await this.dataSource.query("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'conversations'");
    await this.dataSource.query(`CREATE TABLE IF NOT EXISTS users (id varchar PRIMARY KEY NOT NULL, name varchar NOT NULL, email varchar NOT NULL UNIQUE, passwordHash varchar NOT NULL, createdAt datetime NOT NULL DEFAULT (datetime('now')), updatedAt datetime NOT NULL DEFAULT (datetime('now')))`);
    await this.dataSource.query(`CREATE TABLE IF NOT EXISTS uploaded_files (id varchar PRIMARY KEY NOT NULL, name varchar NOT NULL, originalName varchar NOT NULL, mimeType varchar NOT NULL, size integer NOT NULL, relativePath varchar NOT NULL, status varchar NOT NULL DEFAULT ('uploaded'), createdAt datetime NOT NULL DEFAULT (datetime('now')), userId varchar NOT NULL, FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE)`);
    if (!tables.length) {
      await this.dataSource.query(`CREATE TABLE conversations (id varchar PRIMARY KEY NOT NULL, title varchar NOT NULL, mode varchar NOT NULL DEFAULT ('chat'), createdAt datetime NOT NULL DEFAULT (datetime('now')), updatedAt datetime NOT NULL DEFAULT (datetime('now')), userId varchar NOT NULL, FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE)`);
      await this.dataSource.query(`CREATE TABLE IF NOT EXISTS messages (id varchar PRIMARY KEY NOT NULL, role varchar NOT NULL, content text NOT NULL, attachmentId varchar, createdAt datetime NOT NULL DEFAULT (datetime('now')), conversationId varchar, FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE, FOREIGN KEY (attachmentId) REFERENCES uploaded_files(id) ON DELETE SET NULL)`);
      return;
    }
    const columns = await this.dataSource.query('PRAGMA table_info(conversations)') as Array<{ name: string }>;
    if (!columns.some((column) => column.name === 'userId')) await this.dataSource.query('ALTER TABLE conversations ADD COLUMN userId varchar');
    const messageColumns = await this.dataSource.query('PRAGMA table_info(messages)') as Array<{ name: string }>;
    if (!messageColumns.some((column) => column.name === 'attachmentId')) await this.dataSource.query('ALTER TABLE messages ADD COLUMN attachmentId varchar');
    const legacy = await this.dataSource.query('SELECT id FROM users WHERE id = ? LIMIT 1', [LEGACY_USER_ID]);
    if (!legacy.length) {
      const passwordHash = await bcrypt.hash(`legacy-${Date.now()}-${Math.random()}`, 12);
      await this.dataSource.query('INSERT INTO users (id, name, email, passwordHash) VALUES (?, ?, ?, ?)', [LEGACY_USER_ID, 'Legacy Nexora data', LEGACY_EMAIL, passwordHash]);
    }
    await this.dataSource.query('UPDATE conversations SET userId = ? WHERE userId IS NULL OR userId = \'\'', [LEGACY_USER_ID]);
    await this.dataSource.query('CREATE INDEX IF NOT EXISTS IDX_conversations_userId ON conversations (userId)');
    await this.dataSource.query('CREATE INDEX IF NOT EXISTS IDX_uploaded_files_userId ON uploaded_files (userId)');
    await this.dataSource.query('CREATE INDEX IF NOT EXISTS IDX_messages_attachmentId ON messages (attachmentId)');
    await this.dataSource.query(`CREATE TRIGGER IF NOT EXISTS conversations_require_owner_insert BEFORE INSERT ON conversations WHEN NEW.userId IS NULL OR NEW.userId = '' BEGIN SELECT RAISE(ABORT, 'conversation owner is required'); END`);
    await this.dataSource.query(`CREATE TRIGGER IF NOT EXISTS conversations_require_owner_update BEFORE UPDATE OF userId ON conversations WHEN NEW.userId IS NULL OR NEW.userId = '' BEGIN SELECT RAISE(ABORT, 'conversation owner is required'); END`);
  }
}
