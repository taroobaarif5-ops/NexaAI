import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../users/user.entity';
import { Message } from '../messages/message.entity';

@Entity('uploaded_files')
export class UploadedFile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  originalName!: string;

  @Column()
  mimeType!: string;

  @Column('int')
  size!: number;

  @Column()
  relativePath!: string;

  @Column({ default: 'uploaded' })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.uploadedFiles, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user!: User;

  @OneToMany(() => Message, (message) => message.attachment)
  messages!: Message[];
}
