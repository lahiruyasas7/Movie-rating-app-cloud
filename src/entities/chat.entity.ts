// src/chat/message.entity.ts
import {
  Entity,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('message')
export class ChatEntity {
  @PrimaryColumn('uuid', {
    default: () => 'gen_random_uuid()',
  })
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
