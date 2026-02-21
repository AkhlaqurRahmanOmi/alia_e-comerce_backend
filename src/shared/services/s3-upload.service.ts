import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// AWS SDK disabled - this project uses LocalFileStorageService for file uploads
// import {
//   S3Client,
//   PutObjectCommand,
//   DeleteObjectCommand,
// } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

export interface UploadResult {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

@Injectable()
export class S3UploadService {
  private readonly logger = new Logger(S3UploadService.name);
  private readonly s3Client: any; // Type changed to 'any' since S3Client is disabled
  private readonly bucketName: string;
  private readonly endpoint: string | undefined;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    this.logger.warn(
      'S3UploadService is disabled - this project uses LocalFileStorageService',
    );
    this.region =
      this.configService.get<string>('storage.s3.region') || 'us-east-1';
    this.endpoint = this.configService.get<string>('storage.s3.endpoint');
    // Commented out - AWS SDK is not installed
    // const credentials = this.configService.get('storage.s3.credentials');
    // const forcePathStyle = this.configService.get<boolean>('storage.s3.forcePathStyle');

    // this.s3Client = new S3Client({
    //   region: this.region,
    //   endpoint: this.endpoint,
    //   credentials,
    //   forcePathStyle,
    // });

    this.bucketName =
      this.configService.get<string>('storage.s3.bucketName') || '';
  }

  /**
   * Upload a single file to S3
   * NOTE: This service is disabled - use LocalFileStorageService instead
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<UploadResult> {
    throw new InternalServerErrorException(
      'S3 upload is disabled. Please use LocalFileStorageService instead.',
    );
  }

  /**
   * Upload multiple files to S3
   */
  async uploadFiles(
    files: Express.Multer.File[],
    folder: string = 'uploads',
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }

  /**
   * Delete a file from S3
   * NOTE: This service is disabled - use LocalFileStorageService instead
   */
  async deleteFile(fileUrl: string): Promise<void> {
    this.logger.warn(
      'S3 delete is disabled. Use LocalFileStorageService instead.',
    );
  }

  /**
   * Delete multiple files from S3
   */
  async deleteFiles(fileUrls: string[]): Promise<void> {
    const deletePromises = fileUrls.map((url) => this.deleteFile(url));
    await Promise.all(deletePromises);
  }

  /**
   * Generate file URL based on S3 endpoint configuration
   */
  private generateFileUrl(fileName: string): string {
    if (this.endpoint) {
      // Custom S3-compatible endpoint (Synology C2, Cloudflare R2, etc.)
      // Path-style URL: https://endpoint/bucket/key
      return `${this.endpoint}/${this.bucketName}/${fileName}`;
    } else {
      // Standard AWS S3 virtual-hosted-style URL
      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileName}`;
    }
  }

  /**
   * Extract S3 key from full URL
   * Handles both AWS S3 and custom endpoint URLs
   */
  private extractFileKeyFromUrl(fileUrl: string): string {
    const url = new URL(fileUrl);
    const pathname = url.pathname.substring(1); // Remove leading slash

    if (this.endpoint) {
      // Custom endpoint: URL format is https://endpoint/bucket/key
      // Remove bucket name from path
      const bucketPrefix = `${this.bucketName}/`;
      if (pathname.startsWith(bucketPrefix)) {
        return pathname.substring(bucketPrefix.length);
      }
    }

    // AWS S3 or already just the key
    return pathname;
  }
}
