import { InjectQueue } from '@nestjs/bullmq';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Queue } from 'bullmq';
import { CreateVideoDto } from './dto/create-video.dto';
import { VideoService } from './videos.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { UpdateVideoDto } from './dto/update-video.dto';
//import { AuthGuard } from '@nestjs/passport';
import { SkipThrottle } from '@nestjs/throttler';

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

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'add user video',
  })
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

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get User videos by userId',
  })
  @SkipThrottle()
  @Get('by-userId/:userId')
  @UseGuards(AuthGuard)
  async getVideosByUserId(@Param('userId') userId: string) {
    return this.videoService.getVideosByUserId(userId);
  }

  @Put('update/:id')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('video'))
  async updateVideo(
    @Param('id') id: string,
    @Body() dto: UpdateVideoDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.videoService.updateVideo(id, dto, file);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get User video by video ID',
  })
  @SkipThrottle()
  @Get('one-video/:id')
  async getVideoById(@Param('id') id: string) {
    return this.videoService.getVideoById(id);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete User video',
  })
  @Delete('delete/:id')
  @UseGuards(AuthGuard)
  async deleteVideo(@Param('id') id: string) {
    return this.videoService.deleteVideo(id);
  }
}
