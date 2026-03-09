import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { unlink } from 'fs/promises';

const MAX_CMS_MEDIA_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_CMS_MEDIA_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'image/gif',
  'image/avif',
  'image/webp',
  'image/png',
  'image/jpeg',
];

@Injectable()
export class CmsMediaFileValidationPipe implements PipeTransform {
  async transform(value: Express.Multer.File | undefined) {
    if (!value) {
      throw new BadRequestException('No file uploaded');
    }

    if (value.size > MAX_CMS_MEDIA_FILE_SIZE) {
      await this.cleanupTempFile(value);
      throw new BadRequestException(
        `File exceeds maximum size of ${MAX_CMS_MEDIA_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    if (!ALLOWED_CMS_MEDIA_MIME_TYPES.includes(value.mimetype)) {
      await this.cleanupTempFile(value);
      throw new BadRequestException(
        `File type ${value.mimetype} is not allowed for CMS media uploads.`,
      );
    }

    return value;
  }

  private async cleanupTempFile(file: Express.Multer.File): Promise<void> {
    if (!file.path) {
      return;
    }

    try {
      await unlink(file.path);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}
