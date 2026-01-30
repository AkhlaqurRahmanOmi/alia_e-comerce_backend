import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';

/**
 * CoreModule groups core authentication and user management features
 * This includes:
 * - User authentication (login, register, OTP)
 * - User management (CRUD, roles, permissions)
 * - Google authentication
 */
@Module({
  imports: [UserModule, AuthModule],
  exports: [UserModule, AuthModule],
})
export class CoreModule {}
