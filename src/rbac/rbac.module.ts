import { Module } from '@nestjs/common';
import { RbacController } from './rbac.controller';
import { RbacService } from './rbac.service';
import { RoleRepository, PermissionRepository } from './repositories';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [RbacController],
  providers: [
    RbacService,
    RoleRepository,
    PermissionRepository,
  ],
  exports: [
    RbacService,
  ],
})
export class RbacModule {}
