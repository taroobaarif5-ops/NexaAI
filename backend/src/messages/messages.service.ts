import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Message } from './message.entity';
import { Conversation } from '../conversations/conversation.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,

    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
  ) {}

  async create(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    userId: string,
    attachmentId?: string,
  ) {
    const conversation =
      await this.conversationRepository.findOne({
        where: { id: conversationId, user: { id: userId } },
      });

    if (!conversation) {
      throw new NotFoundException(
        'Conversation not found',
      );
    }

    const message = this.messageRepository.create({
      role,
      content,
      conversation,
      attachmentId: attachmentId || undefined,
    });

    return this.messageRepository.save(message);
  }

  async findByConversation(
    conversationId: string, userId: string,
  ) {
    const conversation = await this.conversationRepository.findOne({ where: { id: conversationId, user: { id: userId } } });
    if (!conversation) throw new NotFoundException('Conversation not found.');
    return this.messageRepository.find({
      where: {
        conversation: {
          id: conversationId,
        },
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }
}
