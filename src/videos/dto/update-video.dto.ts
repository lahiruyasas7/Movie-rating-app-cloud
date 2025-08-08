// dto/update-video.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateVideoDto {
  @ApiPropertyOptional({
    type: 'string',
    description: 'Updated name of the video',
    example: 'Updated Video Title',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    type: 'string',
    description: 'Updated description of the video',
    example: 'Updated description of the video',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
