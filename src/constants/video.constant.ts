export const VIDEO_QUEUE = 'video-processing';

export type VideoJobName = 'process-video';

export interface VideoProcessJob {
  videoId: string;
  s3Key: string;
  userId: string;
}
