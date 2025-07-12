// src/chat/message.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';


@Entity('message')
export class MessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  content: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'senderId' })
  sender: UserEntity;

  @Column()
  senderId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'receiverId' })
  receiver: UserEntity;

  @Column()
  receiverId: string;

  @CreateDateColumn()
  createdAt: Date;
}
