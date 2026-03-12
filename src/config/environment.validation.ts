import * as Joi from 'joi';

/**
 * Environment variables validation schema
 * Validates all required environment variables on application startup
 */
export default Joi.object({
  // Application Configuration
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(4000),
  API_VERSION: Joi.string().default('1.0.0'),
  FRONTEND_URL: Joi.string().uri().optional(),

  // Database Configuration
  DATABASE_URL: Joi.string().uri().required(),

  // JWT Configuration
  JWT_SECRET: Joi.string().required(),
  JWT_TOKEN_AUDIENCE: Joi.string().required(),
  JWT_TOKEN_ISSUER: Joi.string().required(),
  JWT_ACCESS_TOKEN_TTL: Joi.number().required(),
  JWT_REFRESH_TOKEN_TTL: Joi.number().required(),

  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),

  // Email Configuration
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().optional(),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASSWORD: Joi.string().optional(),
  SMTP_FROM_EMAIL: Joi.string().email().optional(),
  CONTACT_EMAIL: Joi.string().email().optional(),
  EMAIL_BRAND_NAME: Joi.string().optional(),
  EMAIL_BRAND_HOME_URL: Joi.string().uri().optional(),
  EMAIL_BRAND_LOGO_URL: Joi.string().uri().optional(),
  DEFAULT_CURRENCY: Joi.string().length(3).uppercase().optional(),

  // Logging Configuration
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('debug'),

  // Cache Configuration
  CACHE_TTL: Joi.number().default(60000),
  CACHE_MAX_ITEMS: Joi.number().default(100),

  // Local File Storage Configuration
  UPLOAD_PATH: Joi.string().default('./uploads'),
  BASE_URL: Joi.string().uri().default('http://localhost:4000'),

  // File Upload Configuration
  MAX_FILE_SIZE: Joi.number().default(5242880),
  ALLOWED_IMAGE_TYPES: Joi.string().default('jpg,jpeg,png,webp'),
  MAX_IMAGES_PER_REVIEW: Joi.number().default(5),

  //Production URL
  PRODUCTION_URL: Joi.string().optional(),
});
