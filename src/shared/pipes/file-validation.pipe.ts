import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { unlink } from 'fs/promises';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(private readonly configService: ConfigService) {}

  transform(value: Express.Multer.File | Express.Multer.File[]) {
    if (!value) {
      throw new BadRequestException('No file uploaded');
    }

    const files = Array.isArray(value) ? value : [value];
    const maxFileSize =
      this.configService.get<number>('storage.upload.maxFileSize') || 5242880;
    const allowedTypes = this.configService.get<string[]>(
      'storage.upload.allowedImageTypes',
    ) || ['jpg', 'jpeg', 'png', 'webp'];

    for (const file of files) {
      // Validate file size
      if (file.size > maxFileSize) {
        void this.cleanupTempFiles(files);
        throw new BadRequestException(
          `File ${file.originalname} exceeds maximum size of ${maxFileSize / 1024 / 1024}MB`,
        );
      }

      // Validate file type by MIME type
      const fileExtension = file.mimetype.split('/')[1];
      if (!allowedTypes.includes(fileExtension)) {
        void this.cleanupTempFiles(files);
        throw new BadRequestException(
          `File type ${fileExtension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
        );
      }
    }

    return value;
  }

  private async cleanupTempFiles(files: Express.Multer.File[]): Promise<void> {
    await Promise.all(
      files
        .filter((file) => Boolean(file.path))
        .map(async (file) => {
          try {
            await unlink(file.path);
          } catch (error) {
            if (error.code !== 'ENOENT') {
              throw error;
            }
          }
        }),
    );
  }
}
