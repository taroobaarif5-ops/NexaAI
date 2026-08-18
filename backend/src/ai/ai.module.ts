import { Module } from '@nestjs/common';

import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { MessagesModule } from '../messages/messages.module';
import { AuthModule } from '../auth/auth.module';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [MessagesModule, AuthModule, FilesModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
