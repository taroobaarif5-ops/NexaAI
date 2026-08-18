import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { AiService } from './ai.service';
import { MessagesService } from '../messages/messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FilesService } from '../files/files.service';

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly messagesService: MessagesService,
    private readonly filesService: FilesService,
  ) {}

  @Post('chat')
  async chat(
    @Body()
    body: {
      message: string;
      mode?: string;
      conversationId?: string;
      attachmentId?: string;
    },
    @Res() res: Response, @Req() req: { user: { id: string } },
  ) {
    try {
      if (!body.message?.trim()) {
        res.status(400).json({
          message: 'Please enter a message.',
        });

        return;
      }

      if (!body.conversationId) {
        res.status(400).json({
          message: 'conversationId is required.',
        });

        return;
      }

      res.setHeader(
        'Content-Type',
        'text/plain; charset=utf-8',
      );

      res.setHeader(
        'Cache-Control',
        'no-cache',
      );

      res.setHeader(
        'Connection',
        'keep-alive',
      );

      const attachmentContext = body.attachmentId
        ? await this.filesService.buildAttachmentContext(req.user.id, {
            id: body.attachmentId,
          })
        : null;

      const promptText = attachmentContext
        ? `${attachmentContext}\n\nUser question:\n${body.message.trim()}`
        : body.message.trim();

      // Save the user's message first.
      await this.messagesService.create(
        body.conversationId,
        'user',
        body.message.trim(),
        req.user.id,
        body.attachmentId,
      );

      const stream =
        await this.aiService.chatStream(
          promptText,
          (body.mode || 'general') as
            | 'general'
            | 'study'
            | 'coding'
            | 'math'
            | 'career'
            | 'interview',
        );

      let assistantResponse = '';
      let chunkCount = 0;

      for await (const chunk of stream) {
        const text =
          chunk.choices[0]?.delta?.content;

        if (text) {
          assistantResponse += text;
          res.write(text);
          chunkCount++;
        }

        // Log if finish_reason is set (indicates end of response)
        if (chunk.choices[0]?.finish_reason) {
          console.log(
            `Stream completed. Finish reason: ${chunk.choices[0].finish_reason}, Total chunks: ${chunkCount}, Response length: ${assistantResponse.length} chars`,
          );
        }
      }

      console.log(
        `Final response length: ${assistantResponse.length} chars, Chunk count: ${chunkCount}`,
      );

      // Save the complete AI response.
      if (assistantResponse.trim()) {
        await this.messagesService.create(
          body.conversationId,
          'assistant',
          assistantResponse, req.user.id,
        );
      }

      res.end();
    } catch (error: any) {
      console.error(
        'AI streaming error:',
        error,
      );

      if (!res.headersSent) {
        const status =
          error?.status || 500;

        res
          .status(status)
          .json({
            message:
              error?.message ||
              'Unable to get a response from Nexora.',
          });

        return;
      }

      res.end();
    }
  }
}
