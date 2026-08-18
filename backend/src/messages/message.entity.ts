import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Conversation } from '../conversations/conversation.entity';
import { UploadedFile } from '../files/file.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  role!: string;

  @Column('text')
  content!: string;

  @Column({ nullable: true })
  attachmentId?: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  conversation!: Conversation;

  @ManyToOne(() => UploadedFile, (attachment) => attachment.messages, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  attachment?: UploadedFile;

  @CreateDateColumn()
  createdAt!: Date;
}