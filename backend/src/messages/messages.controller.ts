import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MessagesService } from './messages.service';

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Post()
  create(
    @Body()
    body: {
      conversationId: string;
      role: 'user' | 'assistant';
      content: string;
      attachmentId?: string;
    },
    @Req() req: { user: { id: string } },
  ) {
    return this.messages.create(
      body.conversationId,
      body.role,
      body.content,
      req.user.id,
      body.attachmentId,
    );
  }

  @Get('conversation/:conversationId')
  findByConversation(
    @Param('conversationId') id: string,
    @Req() req: { user: { id: string } },
  ) {
    return this.messages.findByConversation(id, req.user.id);
  }
}
