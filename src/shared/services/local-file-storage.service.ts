import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface UploadResult {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

@Injectable()
export class LocalFileStorageService {
  private readonly logger = new Logger(LocalFileStorageService.name);
  private readonly uploadPath: string;
  private readonly baseUrl: string;
  private readonly allowedFolders: string[];

  constructor(private readonly configService: ConfigService) {
    this.uploadPath =
      this.configService.get<string>('storage.local.uploadPath') || './uploads';
    this.baseUrl =
      this.configService.get<string>('storage.local.baseUrl') ||
      'http://localhost:4000';
    this.allowedFolders =
      this.configService.get<string[]>('storage.local.allowedFolders') || [
        'reviews',
        'products',
        'variants',
        'test',
      ];

    // Ensure base upload directory exists on service initialization
    this.ensureUploadDirectoryExists();
  }

  private async ensureUploadDirectoryExists(): Promise<void> {
    try {
      await fs.access(this.uploadPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.mkdir(this.uploadPath, { recursive: true });
        this.logger.log(`Created upload directory: ${this.uploadPath}`);
      }
    }
  }

  private validateFolder(folder: string): void {
    if (!this.allowedFolders.includes(folder)) {
      throw new BadRequestException(`Invalid upload folder: ${folder}`);
    }

    if (folder.includes('..') || folder.includes('/') || folder.includes('\\')) {
      throw new BadRequestException('Invalid folder name');
    }
  }

  private getFullPath(fileName: string): string {
    return path.join(this.uploadPath, fileName);
  }

  /**
   * Upload a single file to local storage
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<UploadResult> {
    try {
      this.validateFolder(folder);

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const fileName = `${folder}/${uuidv4()}${fileExtension}`;
      const filePath = this.getFullPath(fileName);

      // Ensure folder exists
      const folderPath = path.join(this.uploadPath, folder);
      await fs.mkdir(folderPath, { recursive: true });

      // Write file to disk
      await fs.writeFile(filePath, file.buffer);

      // Generate file URL
      const fileUrl = this.generateFileUrl(fileName);

      this.logger.log(`File uploaded successfully: ${fileName}`);

      return {
        fileUrl,
        fileName,
        fileSize: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'Failed to upload file to local storage',
      );
    }
  }

  /**
   * Upload multiple files to local storage
   */
  async uploadFiles(
    files: Express.Multer.File[],
    folder: string = 'uploads',
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }

  /**
   * Delete a file from local storage
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const fileName = this.extractFileKeyFromUrl(fileUrl);
      const filePath = this.getFullPath(fileName);

      // Check if file exists
      await fs.access(filePath);

      // Delete file
      await fs.unlink(filePath);

      this.logger.log(`File deleted successfully: ${fileName}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.logger.warn(`File not found for deletion: ${fileUrl}`);
        // Don't throw error - file is already gone
        return;
      }

      this.logger.error(`Failed to delete file: ${error.message}`, error.stack);
      // Don't throw error to allow operation to continue (same as S3 service)
    }
  }

  /**
   * Delete multiple files from local storage
   */
  async deleteFiles(fileUrls: string[]): Promise<void> {
    const deletePromises = fileUrls.map((url) => this.deleteFile(url));
    await Promise.all(deletePromises);
  }

  /**
   * Generate file URL for local storage
   */
  private generateFileUrl(fileName: string): string {
    return `${this.baseUrl}/uploads/${fileName}`;
  }

  /**
   * Extract file path from URL
   */
  private extractFileKeyFromUrl(fileUrl: string): string {
    try {
      const url = new URL(fileUrl);
      const pathname = url.pathname;

      // Remove /uploads/ prefix
      const filePath = pathname.replace(/^\/uploads\//, '');

      // Validate path doesn't escape upload directory
      const normalizedPath = path.normalize(filePath);
      if (normalizedPath.startsWith('..')) {
        throw new BadRequestException('Invalid file path');
      }

      return filePath;
    } catch (error) {
      this.logger.error(`Failed to parse file URL: ${fileUrl}`, error.stack);
      throw new BadRequestException('Invalid file URL');
    }
  }
}
