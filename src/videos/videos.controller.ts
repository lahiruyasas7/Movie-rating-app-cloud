import { InjectQueue } from '@nestjs/bullmq';
import { Controller, Post } from '@nestjs/common';
import { Queue } from 'bullmq';

@Controller('videos')
export class VideosController {
  constructor(@InjectQueue('video') private readonly videoQueue: Queue) {}

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
}
