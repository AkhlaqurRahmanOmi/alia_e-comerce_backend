import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { RoleManagementProvider } from './providers/role-management.provider';
import { UserAddressProvider } from './providers/user-address.provider';
import { UserAddressRepository } from './repositories/user-address.repository';
import { PrismaModule } from 'src/core/config/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { UserNotificationService } from './notifications/user-notification.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => AuthModule),
    forwardRef(() => NotificationsModule),
  ],
  providers: [
    UserService,
    UserRepository,
    RoleManagementProvider,
    UserAddressProvider,
    UserAddressRepository,
    UserNotificationService,
  ],
  controllers: [UserController],
  exports: [UserService, UserRepository, UserNotificationService],
})
export class UserModule {}
