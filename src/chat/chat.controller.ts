import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { Not, Repository } from 'typeorm';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
  ) {}

  @Get('messages')
  async getChat(@Query('user1') user1: string, @Query('user2') user2: string) {
    return this.chatService.getMessages(user1, user2);
  }

  @Get('get-all-chats')
  async getAllExcept(@Query('exclude') excludeId: string) {
    return this.userRepo.find({
      where: excludeId ? { userId: Not(excludeId) } : {},
      select: ['userId', 'firstName', 'profileImageUrl'], // only public info
    });
  }
}
