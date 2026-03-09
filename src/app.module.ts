import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from './core/config/prisma/prisma.module';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { AuthenticationGuard } from './auth/guards/authentication/authentication.guard';
import { AccessTokenGuard } from './auth/guards/access-token/access-token.guard';
import { PermissionsGuard } from './auth/guards/permissions/permissions.guard';
import jwtConfig from './auth/config/jwt.config';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import cacheConfig from './config/cache.config';
import storageConfig from './config/storage.config';
import environmentValidation from './config/environment.validation';
import { JwtModule } from '@nestjs/jwt';
import { LoggerModule } from './logger/logger.module';
import { HttpLoggerMiddleware } from './logger/http-logger.middleware';
import { CacheModule } from '@nestjs/cache-manager';
import { SharedModule } from './shared/shared.module';
import { GlobalResponseInterceptor } from './shared/interceptors/global-response.interceptor';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TraceIdMiddleware } from './shared/middleware/trace-id.middleware';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { randomUUID } from 'crypto';

// Organizational Modules
import { CoreModule } from './modules/core.module';
import { AdminModule } from './modules/admin.module';
import { PublicModule } from './modules/public.module';
import { TasksModule } from './tasks/tasks.module';
import { BlogModule } from './blog/blog.module';
@Module({
  imports: [
    // Global configuration with validation
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, cacheConfig, storageConfig, jwtConfig],
      validationSchema: environmentValidation,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    // Event Emitter for async event-driven notifications
    EventEmitterModule.forRoot(),
    // In-memory cache configuration (uses cache.config.ts)
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: (config) => ({
        ttl: config.ttl,
        max: config.max,
      }),
      inject: [cacheConfig.KEY],
    }),
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        storage: diskStorage({
          destination: (_req, _file, callback) => {
            const uploadPath =
              configService.get<string>('storage.local.uploadPath') ||
              './uploads';
            const tempPath = join(uploadPath, 'tmp');
            mkdirSync(tempPath, { recursive: true });
            callback(null, tempPath);
          },
          filename: (_req, file, callback) => {
            callback(null, `${randomUUID()}${extname(file.originalname)}`);
          },
        }),
        limits: {
          fileSize:
            configService.get<number>('storage.upload.maxFileSize') || 5242880,
        },
      }),
    }),

    // Infrastructure Modules
    LoggerModule,
    SharedModule,
    PrismaModule,
    JwtModule.registerAsync(jwtConfig.asProvider()),
    TasksModule, // Scheduled tasks and cron jobs

    // Feature Modules (Organized)
    CoreModule, // Auth, User
    AdminModule, // Orders, Cart, Inventory, Payments, Reports, Coupons, Shipping, Bundles
    PublicModule, // Catalog, Reviews, Notifications
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    AccessTokenGuard,
    // Global permissions guard for role and permission-based access control
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    // Global response interceptor for standardized responses with HATEOAS
    {
      provide: APP_INTERCEPTOR,
      useClass: GlobalResponseInterceptor,
    },
    // Global exception filter for standardized error responses
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TraceIdMiddleware, HttpLoggerMiddleware);
  }
}
