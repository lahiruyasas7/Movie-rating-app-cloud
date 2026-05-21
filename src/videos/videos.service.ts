import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
//import { InjectQueue } from '@nestjs/bullmq';
// { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVideoDto } from './dto/create-video.dto';
import { Video } from 'src/entities/video.entity';
import { UploadService } from 'src/util/uploadTos3.service';
import { UserEntity } from 'src/entities/user.entity';
import { UpdateVideoDto } from './dto/update-video.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { VIDEO_QUEUE, VideoProcessJob } from 'src/constants/video.constant';
import { Queue } from 'bullmq';

@Injectable()
export class VideoService {
  constructor(
    @InjectRepository(Video)
    private readonly videoRepo: Repository<Video>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly uploadService: UploadService,
    @InjectQueue(VIDEO_QUEUE)
    private readonly videoQueue: Queue<VideoProcessJob>,
  ) {}
  private readonly logger = new Logger(VideoService.name);
  // ─── Phase 1: Request Presigned URL ─────────────────────────────────────────

  /**
   * Creates a pending video record and returns a presigned S3 URL.
   * The client will upload the file directly to S3 using this URL.
   */
  async requestPresignedUrl(dto: CreateVideoDto, userId: string) {
    const user = await this.userRepo.findOne({ where: { userId } });
    if (!user) throw new NotFoundException('User not found');

    const { presignedUrl, s3Key } =
      await this.uploadService.generateVideoPresignedUrl(
        dto.originalName,
        dto.mimetype,
      );

    // Persist a pending record so we have a stable ID to track
    const video = this.videoRepo.create({
      name: dto.name,
      description: dto.description,
      s3Key,
      status: 'pending',
      userId,
    });

    const saved = await this.videoRepo.save(video);

    this.logger.log(
      `Presigned URL generated for video ${saved.id}, user ${userId}`,
    );

    return {
      videoId: saved.id,
      presignedUrl,
      expiresInSeconds: 900,
    };
  }

  // ─── Phase 2: Confirm Upload + Enqueue Job ───────────────────────────────────

  /**
   * Called by the client after the direct S3 upload succeeds.
   * Verifies the file exists in S3, then enqueues the processing job.
   */
  async confirmUpload(videoId: string, userId: string) {
    console.log('confirmUpload called:', videoId, userId);
    const video = await this.findVideoOrThrow(videoId);
    console.log('video found, status:', video.status);
    if (video.userId !== userId) throw new ForbiddenException();

    if (video.status !== 'pending') {
      throw new BadRequestException(
        `Video is already in status: ${video.status}`,
      );
    }

    // Verify the file actually landed in S3 — prevents fake confirm requests
    const exists = await this.uploadService.verifyUpload(video.s3Key);
    if (!exists) {
      throw new BadRequestException(
        'File not found in storage. Please upload the file before confirming.',
      );
    }

    // Enqueue the processing job
    await this.videoQueue.add(
      'process-video',
      { videoId: video.id, s3Key: video.s3Key, userId },
      {
        jobId: `video-${video.id}`, // idempotent — prevents duplicate jobs
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 500 },
        removeOnFail: { age: 7 * 24 * 3600 }, // keep failed jobs 7 days
      },
    );
    console.log('job enqueued successfully');
    this.logger.log(`Processing job enqueued for video ${videoId}`);

    return { videoId, status: 'processing' };
  }

  // ─── Phase 3: Poll Status ────────────────────────────────────────────────────

  async getVideoStatus(videoId: string, userId: string) {
    const video = await this.findVideoOrThrow(videoId);
    if (video.userId !== userId) throw new ForbiddenException();

    return {
      videoId: video.id,
      status: video.status,
      s3Url: video.status === 'completed' ? video.s3Url : null,
      errorMessage: video.status === 'failed' ? video.errorMessage : null,
    };
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

  async updateVideo(videoId: string, userId: string, dto: UpdateVideoDto) {
    const video = await this.findVideoOrThrow(videoId);
    if (video.userId !== userId) throw new ForbiddenException();

    Object.assign(video, dto);
    return this.videoRepo.save(video);
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

  async deleteVideo(videoId: string, userId: string) {
    try {
      const video = await this.findVideoOrThrow(videoId);
      if (video.userId !== userId) throw new ForbiddenException();

      // Delete from S3 first, then remove DB record
      if (video.s3Key) {
        await this.uploadService.deleteObject(video.s3Key);
      }

      await this.videoRepo.remove(video);

      return { message: 'Video deleted successfully' };
    } catch (error) {
      console.error('Error deleting video:', error);
      throw new InternalServerErrorException('Failed to delete video');
    }
  }

  // ─── Processor Callbacks (called by VideoUploadProcessor) ───────────────────

  async verifyS3Upload(s3Key: string): Promise<boolean> {
    return this.uploadService.verifyUpload(s3Key);
  }

  async markAsProcessing(videoId: string): Promise<void> {
    await this.videoRepo.update(videoId, { status: 'processing' });
  }

  async markAsCompleted(videoId: string, s3Key: string): Promise<void> {
    const s3Url = this.uploadService.buildPublicUrl(s3Key);
    await this.videoRepo.update(videoId, { status: 'completed', s3Url });
  }

  async markAsFailed(videoId: string, errorMessage: string): Promise<void> {
    await this.videoRepo.update(videoId, {
      status: 'failed',
      errorMessage,
    });
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────────

  private async findVideoOrThrow(videoId: string): Promise<Video> {
    const video = await this.videoRepo.findOne({ where: { id: videoId } });
    if (!video) throw new NotFoundException(`Video not found: ${videoId}`);
    return video;
  }
}
