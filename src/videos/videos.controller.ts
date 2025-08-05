import { InjectQueue } from '@nestjs/bullmq';
import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Queue } from 'bullmq';
import { CreateVideoDto } from './dto/create-video.dto';
import { VideoService } from './videos.service';

@Controller('videos')
export class VideosController {
  constructor(
    @InjectQueue('video') private readonly videoQueue: Queue,
    private readonly videoService: VideoService,
  ) {}

  @Post('process')
  async processVideo() {
    await this.videoQueue.add('process', {
      fileName: 'best-video',
      fileType: 'mp4',
    });
    return {
      message: 'Video processing job added to the queue',
    };
  }

  @Post('add')
  @UseInterceptors(FileInterceptor('video'))
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateVideoDto,
  ) {
    return this.videoService.createVideo(dto, file);
  }
}
