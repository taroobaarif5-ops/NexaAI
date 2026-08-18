import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './conversation.entity';
@Injectable()
export class ConversationsService {
 constructor(@InjectRepository(Conversation) private readonly conversations: Repository<Conversation>) {}
 create(userId: string, mode = 'general') { return this.conversations.save(this.conversations.create({ title: 'New Chat', mode, user: { id: userId } })); }
 findAll(userId: string) { return this.conversations.find({ where: { user: { id: userId } }, order: { updatedAt: 'DESC' } }); }
 async findOne(id: string, userId: string) { const item = await this.conversations.findOne({ where: { id, user: { id: userId } }, relations: { messages: true } }); if (!item) throw new NotFoundException('Conversation not found.'); item.messages.sort((a,b) => a.createdAt.getTime()-b.createdAt.getTime()); return item; }
 async rename(id: string, userId: string, title: string) { const item = await this.conversations.findOne({ where: { id, user: { id: userId } } }); if (!item) throw new NotFoundException('Conversation not found.'); item.title = title?.trim() || 'New Chat'; return this.conversations.save(item); }
 async remove(id: string, userId: string) { const item = await this.conversations.findOne({ where: { id, user: { id: userId } } }); if (!item) throw new NotFoundException('Conversation not found.'); await this.conversations.remove(item); return { success: true, message: 'Conversation deleted' }; }
}
