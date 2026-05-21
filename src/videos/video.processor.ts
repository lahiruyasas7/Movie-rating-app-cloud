import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { UnrecoverableError } from 'bullmq';
import { VideoService } from './videos.service';
import {
  VIDEO_QUEUE,
  VideoJobName,
  VideoProcessJob,
} from 'src/constants/video.constant';

@Processor(VIDEO_QUEUE, {
  concurrency: 5, // process up to 5 jobs in parallel
})
export class VideoUploadProcessor extends WorkerHost {
  private readonly logger = new Logger(VideoUploadProcessor.name);

  constructor(private readonly videoService: VideoService) {
    super();
  }

  async process(job: Job<VideoProcessJob>): Promise<void> {
    this.logger.log(
      `Processing job [${job.id}] name="${job.name}" videoId=${job.data.videoId}`,
    );

    switch (job.name as VideoJobName) {
      case 'process-video':
        return this.handleProcessVideo(job);
      default:
        throw new UnrecoverableError(`Unknown job name: ${job.name}`);
    }
  }

  // ─── Handlers ───────────────────────────────────────────────────────────────

  private async handleProcessVideo(job: Job<VideoProcessJob>): Promise<void> {
    const { videoId, s3Key } = job.data;

    try {
      // Step 1 — Verify the file actually exists in S3
      await job.updateProgress(10);
      const exists = await this.videoService.verifyS3Upload(s3Key);

      if (!exists) {
        // File missing in S3 — retrying won't help
        throw new UnrecoverableError(
          `S3 object not found for video ${videoId}, key: ${s3Key}`,
        );
      }

      // Step 2 — Mark as processing in DB
      await job.updateProgress(30);
      await this.videoService.markAsProcessing(videoId);

      // Step 3 — Build final public URL and mark completed
      // NOTE: This is where you would add video transcoding,
      //       thumbnail generation, etc. in the future.
      await job.updateProgress(80);
      await this.videoService.markAsCompleted(videoId, s3Key);

      await job.updateProgress(100);
      this.logger.log(`Video ${videoId} processed successfully`);
    } catch (error) {
      // Don't catch UnrecoverableError — let BullMQ handle it
      if (error instanceof UnrecoverableError) throw error;

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // For transient errors (network, DB), mark failed and rethrow for retry
      this.logger.error(`Job failed for video ${videoId}: ${errorMessage}`);
      await this.videoService.markAsFailed(videoId, errorMessage);

      throw error; // BullMQ will retry based on job options
    }
  }

  // ─── Worker Events ───────────────────────────────────────────────────────────

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job [${job.id}] completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Job [${job.id}] failed after ${job.attemptsMade} attempts: ${error.message}`,
    );
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string) {
    this.logger.warn(`Job [${jobId}] stalled — will be retried`);
  }
}
