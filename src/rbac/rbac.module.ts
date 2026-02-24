import { Module } from '@nestjs/common';
import { RbacController } from './rbac.controller';
import { RbacService } from './rbac.service';
import { RoleRepository, PermissionRepository } from './repositories';
import { SharedModule } from '@/shared/shared.module';
import { RoleManagementProvider } from '@/rbac/providers/role-management.provider';

@Module({
  imports: [SharedModule],
  controllers: [RbacController],
  providers: [RbacService, RoleRepository, PermissionRepository, RoleManagementProvider],
  exports: [RbacService,RoleManagementProvider],
})
export class RbacModule {}
