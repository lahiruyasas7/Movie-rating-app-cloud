import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";

@Processor('video-processing')
export class VideoProcessor extends WorkerHost {
  async process(job: Job) {
    const { videoId, s3Url } = job.data;

    console.log(`Processing video ${videoId} from ${s3Url}`);

    // Your logic: e.g., transcode, thumbnail, etc.
    // After processing, update DB if needed
  }
}