import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  ObjectCannedACL,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';
import { Express } from 'express';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly s3: S3Client;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3Client({
      region: configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });

    this.bucketName = configService.get<string>('AWS_BUCKET_NAME');
  }

  async uploadProfileImage(file: Express.Multer.File): Promise<string> {
    if (!file) return null;

    const fileExt = extname(file.originalname);
    const fileName = `user-profile-images/${uuid()}${fileExt}`;

    const uploadParams = {
      Bucket: this.bucketName,
      Key: fileName,
      Body: file.buffer,
      ACL: 'public-read' as ObjectCannedACL,
      ContentType: file.mimetype,
    };

    try {
      await this.s3.send(new PutObjectCommand(uploadParams));
      const publicUrl = `https://${this.bucketName}.s3.${this.configService.get(
        'AWS_REGION',
      )}.amazonaws.com/${fileName}`;
      return publicUrl;
    } catch (error) {
      this.logger.error(`Failed to upload file to S3: ${error.message}`);
      throw error;
    }
  }

  async uploadVideo(file: Express.Multer.File): Promise<string> {
    if (!file) return null;

    const fileExt = extname(file.originalname);
    const fileName = `user-videos/${uuid()}${fileExt}`;

    const uploadParams = {
      Bucket: this.bucketName,
      Key: fileName,
      Body: file.buffer,
      ACL: 'public-read' as ObjectCannedACL,
      ContentType: file.mimetype,
    };

    try {
      await this.s3.send(new PutObjectCommand(uploadParams));
      return `https://${this.bucketName}.s3.${this.configService.get(
        'AWS_REGION',
      )}.amazonaws.com/${fileName}`;
    } catch (error) {
      this.logger.error(`Failed to upload video to S3: ${error.message}`);
      throw error;
    }
  }
}
