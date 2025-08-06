import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Video } from 'src/entities/video.entity';
import { VideosController } from './videos.controller';
import { VideoService } from './videos.service';
import { UploadService } from 'src/util/uploadTos3.service';
import { VideoProcessor } from './video.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Video]),
    BullModule.registerQueue({
      name: 'video-processing',
    }),
  ],
  controllers: [VideosController],
  providers: [
    VideoService,
    VideoProcessor,
    UploadService,
    //VideoQueueEventsListener,
  ],
})
export class VideoModule {}
