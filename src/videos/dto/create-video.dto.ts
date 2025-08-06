import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateVideoDto {
  @ApiProperty({
    type: 'string',
    description: 'Name of the video',
    required: true,
    example: 'My Awesome Video tailer',
  })
  @IsNotEmpty({ message: 'Video name cannot be empty' })
  name: string;

  @ApiProperty({
    type: 'string',
    description: 'Description of the video',
    required: true,
    example: 'This is a description of my awesome video',
  })
  @IsNotEmpty({ message: 'Video Description cannot be empty' })
  description: string;
}
