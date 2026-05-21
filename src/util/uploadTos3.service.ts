import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  ObjectCannedACL,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const PRESIGNED_URL_EXPIRES_IN_SECONDS = 900; // 15 minutes

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

  /**
   * Generates a presigned PUT URL so the client can upload
   * the video file directly to S3 — your server never touches
   * the file bytes.
   */
  async generateVideoPresignedUrl(
    originalName: string,
    mimetype: string,
  ): Promise<{ presignedUrl: string; s3Key: string }> {
    const fileExt = extname(originalName).toLowerCase();
    const s3Key = `user-videos/${uuid()}${fileExt}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      ContentType: mimetype,
    });

    const presignedUrl = await getSignedUrl(this.s3 as any, command, {
      expiresIn: PRESIGNED_URL_EXPIRES_IN_SECONDS,
    });

    return { presignedUrl, s3Key };
  }
  // ─── Verify Upload ──────────────────────────────────────────────────────────

  /**
   * Checks that the object actually exists in S3 after
   * the client reports a successful upload.
   * Prevents fake confirm requests.
   */
  async verifyUpload(s3Key: string): Promise<boolean> {
    try {
      await this.s3.send(
        new HeadObjectCommand({ Bucket: this.bucketName, Key: s3Key }),
      );
      return true;
    } catch {
      return false;
    }
  }

  // ─── Build Public URL ───────────────────────────────────────────────────────

  buildPublicUrl(s3Key: string): string {
    return `https://${this.bucketName}.s3.${this.configService.get(
      'AWS_REGION',
    )}.amazonaws.com/${s3Key}`;
  }

  // ─── Delete Object ──────────────────────────────────────────────────────────

  async deleteObject(s3Key: string): Promise<void> {
    try {
      await this.s3.send(
        new DeleteObjectCommand({ Bucket: this.bucketName, Key: s3Key }),
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      // Log but don't throw — deletion failure shouldn't break app flow.
      // A background cleanup job can handle orphaned objects.
      this.logger.warn(
        `Failed to delete S3 object [${s3Key}]: ${errorMessage}`,
      );
    }
  }
}
