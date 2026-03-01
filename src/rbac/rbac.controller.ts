import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Permissions } from '../auth/decorator/permissions.decorator';
import { CacheTTL } from '../shared/decorators/cache-ttl.decorator';
import { RoleManagementProvider } from './providers/role-management.provider';

import { RbacService } from './rbac.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  CreatePermissionDto,
  UpdatePermissionDto,
  AssignPermissionsDto,
  AssignUserRoleDto,
} from './dtos';

@Controller('rbac')
export class RbacController {
  constructor(
    private readonly rbacService: RbacService,
    private readonly roleManagementProvider: RoleManagementProvider,
  ) {}

  // ===========================
  // Role Management Endpoints
  // ===========================

  /**
   * Create a new role
   * Admin endpoint to add a new role to the system
   * Requires 'roles:create' permission
   */
  @Post('roles')
  @Permissions('roles:create')
  @HttpCode(HttpStatus.CREATED)
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.rbacService.createRole(createRoleDto);
  }

  /**
   * Get all roles
   * Returns list of all roles with permissions and user count
   * Cached for 5 minutes
   * Requires 'roles:view' permission
   */
  @Get('roles')
  @Permissions('roles:view')
  @CacheTTL(300000)
  @HttpCode(HttpStatus.OK)
  async getAllRoles() {
    return this.rbacService.getAllRoles();
  }

  /**
   * Get role by ID
   * Fetch role details including assigned permissions and user count
   * Cached for 5 minutes
   * Requires 'roles:view' permission
   */
  @Get('roles/:id')
  @Permissions('roles:view')
  @CacheTTL(300000)
  @HttpCode(HttpStatus.OK)
  async getRoleById(@Param('id', ParseIntPipe) id: number) {
    return this.rbacService.getRoleById(id);
  }

  /**
   * Get role by name
   * Fetch role details using role name
   * Cached for 5 minutes
   * Requires 'roles:view' permission
   */
  @Get('roles/name/:name')
  @Permissions('roles:view')
  @CacheTTL(300000)
  @HttpCode(HttpStatus.OK)
  async getRoleByName(@Param('name') name: string) {
    return this.rbacService.getRoleByName(name);
  }

  /**
   * Update an existing role
   * Admin endpoint to modify role details (name, description)
   * Requires 'roles:update' permission
   */
  @Patch('roles/:id')
  @Permissions('roles:update')
  @HttpCode(HttpStatus.OK)
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rbacService.updateRole(id, updateRoleDto);
  }

  /**
   * Delete a role
   * Admin endpoint to remove a role from the system
   * Cannot delete if role has assigned users
   * Requires 'roles:delete' permission
   */
  @Delete('roles/:id')
  @Permissions('roles:delete')
  @HttpCode(HttpStatus.OK)
  async deleteRole(@Param('id', ParseIntPipe) id: number) {
    return this.rbacService.deleteRole(id);
  }

  // ===========================
  // Role-Permission Assignment Endpoints
  // ===========================

  /**
   * Assign permissions to a role
   * Admin endpoint to grant permissions to a role
   * Requires 'roles:assign' permission
   */
  @Post('roles/:id/permissions')
  @Permissions('roles:assign')
  @HttpCode(HttpStatus.OK)
  async assignPermissionsToRole(
    @Param('id', ParseIntPipe) roleId: number,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    return this.rbacService.assignPermissionsToRole(
      roleId,
      assignPermissionsDto,
    );
  }

  /**
   * Remove permissions from a role (batch)
   * Admin endpoint to revoke multiple permissions from a role
   * Requires 'roles:assign' permission
   */
  @Delete('roles/:id/permissions/batch')
  @Permissions('roles:assign')
  @HttpCode(HttpStatus.OK)
  async removePermissionsFromRole(
    @Param('id', ParseIntPipe) roleId: number,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    return this.rbacService.removePermissionsFromRole(
      roleId,
      assignPermissionsDto.permissionIds,
    );
  }

  /**
   * Remove a single permission from a role
   * Admin endpoint to revoke one permission from a role
   * Requires 'roles:assign' permission
   */
  @Delete('roles/:id/permissions/:permissionId')
  @Permissions('roles:assign')
  @HttpCode(HttpStatus.OK)
  async removePermissionFromRole(
    @Param('id', ParseIntPipe) roleId: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    return this.rbacService.removePermissionsFromRole(roleId, [permissionId]);
  }

  // ===========================
  // User-Role Assignment Endpoints
  // ===========================

  /**
   * Assign a role to a user
   * Requires 'roles:assign' permission
   */
  @Post('users/:id/roles')
  @Permissions('roles:assign')
  @HttpCode(HttpStatus.OK)
  async assignRoleToUser(
    @Param('id', ParseIntPipe) userId: number,
    @Body() assignUserRoleDto: AssignUserRoleDto,
  ) {
    return this.roleManagementProvider.assignRoleToUser(
      userId,
      assignUserRoleDto.roleName,
    );
  }

  /**
   * Remove a role from a user
   * Requires 'roles:assign' permission
   */
  @Delete('users/:id/roles/:roleName')
  @Permissions('roles:assign')
  @HttpCode(HttpStatus.OK)
  async removeRoleFromUser(
    @Param('id', ParseIntPipe) userId: number,
    @Param('roleName') roleName: string,
  ) {
    return this.roleManagementProvider.removeRoleFromUser(userId, roleName);
  }

  /**
   * Get roles assigned to a user
   * Requires 'roles:view' permission
   */
  @Get('users/:id/roles')
  @Permissions('roles:view')
  @HttpCode(HttpStatus.OK)
  async getUserRoles(@Param('id', ParseIntPipe) userId: number) {
    return this.roleManagementProvider.getUserRoles(userId);
  }

  /**
   * Get effective permissions for a user
   * Requires 'permissions:view' permission
   */
  @Get('users/:id/permissions')
  @Permissions('permissions:view')
  @HttpCode(HttpStatus.OK)
  async getUserPermissions(@Param('id', ParseIntPipe) userId: number) {
    return this.roleManagementProvider.getUserPermissions(userId);
  }

  // ===========================
  // Permission Management Endpoints
  // ===========================

  /**
   * Create a new permission
   * Admin endpoint to add a new permission to the system
   * Permission name must follow format "resource:action"
   * Requires 'permissions:create' permission
   */
  @Post('permissions')
  @Permissions('permissions:create')
  @HttpCode(HttpStatus.CREATED)
  async createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    return this.rbacService.createPermission(createPermissionDto);
  }

  /**
   * Get all permissions
   * Returns list of all permissions with role assignments
   * Cached for 5 minutes
   * Requires 'permissions:view' permission
   */
  @Get('permissions')
  @Permissions('permissions:view')
  @CacheTTL(300000)
  @HttpCode(HttpStatus.OK)
  async getAllPermissions() {
    return this.rbacService.getAllPermissions();
  }

  /**
   * Get permission by ID
   * Fetch permission details including assigned roles
   * Cached for 5 minutes
   * Requires 'permissions:view' permission
   */
  @Get('permissions/:id')
  @Permissions('permissions:view')
  @CacheTTL(300000)
  @HttpCode(HttpStatus.OK)
  async getPermissionById(@Param('id', ParseIntPipe) id: number) {
    return this.rbacService.getPermissionById(id);
  }

  /**
   * Get permission by name
   * Fetch permission details using permission name
   * Cached for 5 minutes
   * Requires 'permissions:view' permission
   */
  @Get('permissions/name/:name')
  @Permissions('permissions:view')
  @CacheTTL(300000)
  @HttpCode(HttpStatus.OK)
  async getPermissionByName(@Param('name') name: string) {
    return this.rbacService.getPermissionByName(name);
  }

  /**
   * Update an existing permission
   * Admin endpoint to modify permission details
   * Requires 'permissions:update' permission
   */
  @Patch('permissions/:id')
  @Permissions('permissions:update')
  @HttpCode(HttpStatus.OK)
  async updatePermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.rbacService.updatePermission(id, updatePermissionDto);
  }

  /**
   * Delete a permission
   * Admin endpoint to remove a permission from the system
   * Cannot delete if permission is assigned to any roles
   * Requires 'permissions:delete' permission
   */
  @Delete('permissions/:id')
  @Permissions('permissions:delete')
  @HttpCode(HttpStatus.OK)
  async deletePermission(@Param('id', ParseIntPipe) id: number) {
    return this.rbacService.deletePermission(id);
  }

  // ===========================
  // Search Endpoint
  // ===========================

  /**
   * Search roles and permissions
   * Searches both roles and permissions by name or description
   * Cached for 2 minutes
   * Requires 'roles:view' or 'permissions:view' permission
   */
  @Get('search')
  @Permissions('roles:view')
  @CacheTTL(120000)
  @HttpCode(HttpStatus.OK)
  async search(@Query('q') query: string) {
    return this.rbacService.search(query);
  }
}
