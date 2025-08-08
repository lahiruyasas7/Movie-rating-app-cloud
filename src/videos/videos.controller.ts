import { InjectQueue } from '@nestjs/bullmq';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Queue } from 'bullmq';
import { CreateVideoDto } from './dto/create-video.dto';
import { VideoService } from './videos.service';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
//import { AuthGuard } from '@nestjs/passport';

@ApiTags('Videos')
@Controller('videos')
export class VideosController {
  constructor(
    // @InjectQueue('video') private readonly videoQueue: Queue,
    private readonly videoService: VideoService,
  ) {}

  //   @Post('process')
  //   async processVideo() {
  //     await this.videoQueue.add('process', {
  //       fileName: 'best-video',
  //       fileType: 'mp4',
  //     });
  //     return {
  //       message: 'Video processing job added to the queue',
  //     };
  //   }

  @Post('add/:userId')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('video'))
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateVideoDto,
    @Param('userId') userId: string,
  ) {
    return this.videoService.createVideo(dto, file, userId);
  }

  @Get('by-userId/:userId')
  @UseGuards(AuthGuard)
  async getVideosByUserId(@Param('userId') userId: string) {
    return this.videoService.getVideosByUserId(userId);
  }
}
