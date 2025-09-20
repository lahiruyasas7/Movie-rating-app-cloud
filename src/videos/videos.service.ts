import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVideoDto } from './dto/create-video.dto';
import { Video } from 'src/entities/video.entity';
import { UploadService } from 'src/util/uploadTos3.service';
import { UserEntity } from 'src/entities/user.entity';
import { UpdateVideoDto } from './dto/update-video.dto';

@Injectable()
export class VideoService {
  constructor(
    @InjectRepository(Video)
    private readonly videoRepo: Repository<Video>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
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
      const user = await this.userRepo.findOne({ where: { userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
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

  async getVideosByUserId(userId: string) {
    try {
      const videos = await this.videoRepo.find({
        where: { userId },
      });

      if (!videos || videos.length === 0) {
        throw new NotFoundException('No videos found for this user');
      }

      return videos;
    } catch (error) {
      console.error('Error fetching videos:', error);

      // If it's already a known exception, re-throw it
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to fetch videos');
    }
  }

  async updateVideo(
    id: string,
    dto: UpdateVideoDto,
    file?: Express.Multer.File,
  ): Promise<Video> {
    const video = await this.videoRepo.findOne({ where: { id } });
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // Update fields if provided
    if (dto.name) video.name = dto.name;
    if (dto.description) video.description = dto.description;

    // Replace video in S3 if new file provided
    if (file) {
      // Optional: Delete old file from S3
      const oldKey = video.s3Url.split('.amazonaws.com/')[1];
      await this.uploadService.deleteFile(oldKey);

      // Upload new file
      const newS3Url = await this.uploadService.uploadVideo(file);
      video.s3Url = newS3Url;
    }

    return await this.videoRepo.save(video);
  }

  async getVideoById(id: string): Promise<Video> {
    try {
      console.log('Fetching video with ID:', id);
      const video = await this.videoRepo.findOne({ where: { id } });
      if (!video) {
        throw new NotFoundException('Video not found');
      }
      console.log('Video found:', video);
      return video;
    } catch (error) {
      console.error('Error fetching video:', error);
      throw new InternalServerErrorException('Failed to fetch video');
    }
  }

  async deleteVideo(id: string): Promise<{ message: string }> {
    try {
      const video = await this.videoRepo.findOne({ where: { id } });
      if (!video) {
        throw new NotFoundException('Video not found');
      }

      // Extract the S3 key from the s3Url
      const fileKey = video.s3Url.split('.amazonaws.com/')[1];

      // Delete file from S3
      await this.uploadService.deleteFile(fileKey);

      // Delete video from database
      await this.videoRepo.remove(video);

      return { message: 'Video deleted successfully' };
    } catch (error) {
      console.error('Error deleting video:', error);
      throw new InternalServerErrorException('Failed to delete video');
    }
  }
}
