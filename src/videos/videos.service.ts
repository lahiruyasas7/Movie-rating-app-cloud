import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVideoDto } from './dto/create-video.dto';
import { Video } from 'src/entities/video.entity';
import { UploadService } from 'src/util/uploadTos3.service';

@Injectable()
export class VideoService {
  constructor(
    @InjectRepository(Video)
    private readonly videoRepo: Repository<Video>,
    private readonly uploadService: UploadService,
    @InjectQueue('video-processing')
    private readonly videoQueue: Queue,
  ) {}

  async createVideo(
    dto: CreateVideoDto,
    file: Express.Multer.File,
    userId: string,
  ) {
    try {
      const s3Url = await this.uploadService.uploadVideo(file);

      const video = this.videoRepo.create({
        name: dto.name,
        description: dto.description,
        s3Url,
        userId,
      });

      const saved = await this.videoRepo.save(video);

      // Enqueue background job
      await this.videoQueue.add('process-video', {
        videoId: saved.id,
        s3Url,
      });

      return saved;
    } catch (error) {
      console.error('Error creating video:', error);
      throw new InternalServerErrorException('Failed to create video');
    }
  }
}
