import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AiModule } from './ai/ai.module';
import { MessagesModule } from './messages/messages.module';
import { ConversationsModule } from './conversations/conversations.module';
import { AuthModule } from './auth/auth.module';
import { FilesModule } from './files/files.module';
import { DatabaseMigrationService } from './database-migration.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'nexora.sqlite',
      autoLoadEntities: true,
      synchronize: false,
    }),

    ConversationsModule,
    AuthModule,
    MessagesModule,
    FilesModule,
    AiModule,
  ],
  providers: [DatabaseMigrationService],
})
export class AppModule {}
