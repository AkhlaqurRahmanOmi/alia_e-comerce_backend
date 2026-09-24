import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { NestExpressApplication } from '@nestjs/platform-express';
import { swaggerConfig } from './config/swagger.config';
import { isAbsolute, resolve } from 'path';
import { OpenApiModule } from './openapi/open-api.module';

async function bootstrap() {
  // Create app with Winston logger only (disable default NestJS logger)
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  //using etag for cache validation
  app.set('etag', 'weak');

  // Get configuration service
  const configService = app.get(ConfigService);
  const configuredUploadPath =
    configService.get<string>('storage.local.uploadPath') || './uploads';
  const staticUploadPath = isAbsolute(configuredUploadPath)
    ? configuredUploadPath
    : resolve(process.cwd(), configuredUploadPath);

  // Serve uploaded files as static assets from the configured storage path
  app.useStaticAssets(staticUploadPath, {
    prefix: '/uploads/',
  });

  // Get Winston logger instance
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);

  // Replace NestJS logger with Winston
  app.useLogger(logger);

  // Get app configuration
  const port = configService.get<number>('app.port') || 4000;
  const apiVersion = configService.get<string>('app.apiVersion') || '1.0.0';
  const environment = configService.get<string>('app.nodeEnv');

  //testing something
  // app.use((req, res, next) => {
  //   if (req.method === 'GET') {
  //     res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  //   }
  //   next();
  // });

  // Set global prefix and enable versioning (must be before Swagger setup)
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Setup Swagger documentation (after versioning is configured)
  // const documentation = new DocumentBuilder()
  //   .setTitle('E-Commerce API')
  //   .setDescription('E-Commerce REST API Documentation')
  //   .setVersion(apiVersion)
  //   .addServer(`http://localhost:${port}`, 'Local development server')
  //   .addBearerAuth(
  //     {
  //       type: 'http',
  //       scheme: 'bearer',
  //       bearerFormat: 'JWT',
  //       name: 'JWT',
  //       description: 'Enter JWT token',
  //       in: 'header',
  //     },
  //     'JWT-auth',
  //   )
  //   .build();

  const documentation = SwaggerModule.createDocument(app, swaggerConfig);
  // const documentFactory = () => SwaggerModule.createDocument(app, documentation);

  OpenApiModule.setup('api/docs', app, documentation);

  // Enable CORS
  const configuredFrontendUrl =
    configService.get<string>('FRONTEND_URL') || process.env.FRONTEND_URL;

  const allowedOrigins = [
    configuredFrontendUrl,
    'https://aliaatelier.shop',
    'https://www.aliaatelier.shop',
    'https://admin.aliaatelier.shop',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, Postman, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith('.aliaatelier.shop') ||
        (environment !== 'production' &&
          (/^http:\/\/localhost(:\d+)?$/.test(origin) ||
            /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)));

      if (isAllowed) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Trace-Id',
      'x-device-id',
      'x-session-id',
    ],
    exposedHeaders: ['X-Trace-Id', 'Content-Disposition'],
  });

  await app.listen(port);

  // Use Winston logger for startup messages
  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
  logger.log(`🔄 API Versioning enabled - URI-based with default version '1'`);
  logger.log(`🌍 Environment: ${environment}`);
  logger.log(`📦 API Version: ${apiVersion}`);
}
bootstrap();
