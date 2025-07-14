import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatEntity } from 'src/entities/chat.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatEntity)
    private chatRepository: Repository<ChatEntity>,
  ) {}

  async saveMessage(senderId: string, receiverId: string, content: string) {
    const msg = this.chatRepository.create({ senderId, receiverId, content });
    return await this.chatRepository.save(msg);
  }

  async getMessages(userId1: string, userId2: string) {
    return this.chatRepository.find({
      where: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
      order: { createdAt: 'ASC' },
    });
  }
}
