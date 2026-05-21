import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateVideoDto } from './dto/create-video.dto';
import { VideoService } from './videos.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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

  // ─── Phase 1: Request Presigned URL ───────────────────────────────────────
  // Client sends file metadata → gets a presigned URL + videoId back.
  // The actual file bytes never touch this server.
  @ApiBearerAuth('JWT-auth')
  @Post('presign/:userId')
  @ApiOperation({
    summary: 'Request a presigned S3 URL for direct video upload',
    description:
      'Returns a presigned PUT URL (valid 15 min) and a videoId. ' +
      'The client uploads the file directly to S3 using that URL, ' +
      'then calls POST /videos/:id/confirm.',
  })
  @ApiResponse({
    status: 201,
    description: '{ videoId, presignedUrl, expiresInSeconds }',
  })
  @UseGuards(AuthGuard)
  async requestPresignedUrl(
    @Body() dto: CreateVideoDto,
    @Param('userId') userId: string,
  ) {
    return this.videoService.requestPresignedUrl(dto, userId);
  }

  // ─── Phase 2: Confirm Upload ───────────────────────────────────────────────
  // Called by client after it finishes uploading to S3.
  // Verifies file exists in S3, then enqueues the BullMQ job.

  @Post(':id/confirm/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm direct S3 upload is complete',
    description:
      'Verifies the file exists in S3, then queues the video for processing.',
  })
  @ApiResponse({
    status: 200,
    description: '{ videoId, status: "processing" }',
  })
  @UseGuards(AuthGuard)
  async confirmUpload(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId') userId: string,
  ) {
    return this.videoService.confirmUpload(id, userId);
  }

  // ─── Phase 3: Poll Status ──────────────────────────────────────────────────
  // Called by client every ~5 seconds until status = completed | failed.
  // SkipThrottle because polling needs to be frequent and reliable.

  @Get(':id/status/:userId')
  @SkipThrottle()
  @ApiOperation({ summary: 'Poll processing status for a video' })
  @ApiResponse({
    status: 200,
    description: '{ videoId, status, s3Url?, errorMessage? }',
  })
  @UseGuards(AuthGuard)
  async getVideoStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId') userId: string,
  ) {
    console.log('CONTROLLER HIT - confirmUpload:', id, userId);
    return this.videoService.getVideoStatus(id, userId);
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

  @ApiBearerAuth('JWT-auth')
  @Put(':id/user/:userId')
  @ApiOperation({ summary: 'Update video name or description' })
  @UseGuards(AuthGuard)
  async updateVideo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVideoDto,
    @Param('userId') userId: string,
  ) {
    return this.videoService.updateVideo(id, userId, dto);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get User video by video ID',
  })
  @SkipThrottle()
  @Get('one-video/:id')
  @UseGuards(AuthGuard)
  async getVideoById(@Param('id') id: string) {
    return this.videoService.getVideoById(id);
  }

  @ApiBearerAuth('JWT-auth')
  @Delete(':id/user/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a video (removes from S3 and DB)' })
  @UseGuards(AuthGuard)
  async deleteVideo(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId') userId: string,
  ) {
    return this.videoService.deleteVideo(id, userId);
  }
}
