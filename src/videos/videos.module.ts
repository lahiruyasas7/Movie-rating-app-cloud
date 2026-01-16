import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Video } from 'src/entities/video.entity';
import { VideosController } from './videos.controller';
import { VideoService } from './videos.service';
import { UploadService } from 'src/util/uploadTos3.service';
//import { VideoProcessor } from './video.processor';
import { AuthModule } from 'src/auth/auth.module';
import { UserEntity } from 'src/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Video, UserEntity]),
    BullModule.registerQueue({
      name: 'video-processing',
    }),
    AuthModule,
  ],
  controllers: [VideosController],
  providers: [VideoService, UploadService],
})
export class VideoModule {}
