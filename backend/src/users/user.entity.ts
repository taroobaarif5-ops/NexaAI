import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Conversation } from '../conversations/conversation.entity';
import { UploadedFile } from '../files/file.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() name!: string;
  @Column({ unique: true }) email!: string;
  @Column() passwordHash!: string;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
  @OneToMany(() => Conversation, (conversation) => conversation.user)
  conversations!: Conversation[];

  @OneToMany(() => UploadedFile, (file) => file.user)
  uploadedFiles!: UploadedFile[];
}
