import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { BullModule } from '@nestjs/bullmq';
import { Video } from 'src/entities/video.entity';
import { VideosController } from './videos.controller';
import { VideoService } from './videos.service';
import { UploadService } from 'src/util/uploadTos3.service';
//import { VideoProcessor } from './video.processor';
import { AuthModule } from 'src/auth/auth.module';
import { UserEntity } from 'src/entities/user.entity';
import { BullModule } from '@nestjs/bullmq';
import { VIDEO_QUEUE } from 'src/constants/video.constant';
import { VideoUploadProcessor } from './video.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Video, UserEntity]),
    BullModule.registerQueue({
      name: VIDEO_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 500 },
        removeOnFail: { age: 7 * 24 * 3600 },
      },
    }),
    AuthModule,
  ],
  controllers: [VideosController],
  providers: [VideoService, UploadService, VideoUploadProcessor],
})
export class VideoModule {}
