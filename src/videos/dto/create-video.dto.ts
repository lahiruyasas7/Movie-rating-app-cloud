import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsNumber, IsString, Max } from 'class-validator';

const ALLOWED_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-msvideo',
];
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

export class CreateVideoDto {
  @ApiProperty({
    type: 'string',
    description: 'Name of the video',
    required: true,
    example: 'My Awesome Video tailer',
  })
  @IsString()
  @IsNotEmpty({ message: 'Video name cannot be empty' })
  name: string;

  @ApiProperty({
    type: 'string',
    description: 'Description of the video',
    required: true,
    example: 'This is a description of my awesome video',
  })
  @IsString()
  @IsNotEmpty({ message: 'Video Description cannot be empty' })
  description: string;

  @ApiProperty({ example: 'video/mp4' })
  @IsString()
  @IsIn(ALLOWED_MIME_TYPES, {
    message: `mimetype must be one of: ${ALLOWED_MIME_TYPES.join(', ')}`,
  })
  mimetype: string;

  @ApiProperty({ example: 'tutorial.mp4' })
  @IsString()
  @IsNotEmpty()
  originalName: string;

  @ApiProperty({ example: 104857600 })
  @IsNumber()
  @Max(MAX_FILE_SIZE_BYTES, {
    message: `File size must not exceed ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`,
  })
  fileSize: number;
}
