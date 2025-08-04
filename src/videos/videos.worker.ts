import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('video', { concurrency: 3 }) //concurrency means up to 3 jobs can be processed in parallel by the same worker.
export class VideosProcessor extends WorkerHost {
  async process(job: Job) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  @OnWorkerEvent('active')
  onloadeddata(job: Job) {
    console.log(`got a new job with ${job.id}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    console.log(`job ${job.id} completed!`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    console.error(`job ${job.id} failed with error: ${err.message}`);
  }
}
