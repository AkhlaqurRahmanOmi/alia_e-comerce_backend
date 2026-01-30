import { registerAs } from '@nestjs/config';

/**
 * Storage configuration for local file storage and file uploads
 * Contains local storage settings and upload configuration
 */
export default registerAs('storage', () => ({
  // Local File Storage Configuration
  local: {
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    baseUrl: process.env.BASE_URL || 'http://localhost:4000',
    allowedFolders: ['reviews', 'products', 'variants', 'test'],
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
    allowedImageTypes: process.env.ALLOWED_IMAGE_TYPES?.split(',') || [
      'jpg',
      'jpeg',
      'png',
      'webp',
    ],
    maxImagesPerReview: parseInt(process.env.MAX_IMAGES_PER_REVIEW || '5', 10),
  },
}));
