import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { RoleRepository, PermissionRepository } from './repositories';
import {
  CreateRoleDto,
  UpdateRoleDto,
  CreatePermissionDto,
  UpdatePermissionDto,
  AssignPermissionsDto,
  AssignRolesDto,
} from './dtos';
import {
  RoleWithRelations,
  PermissionWithRelations,
  RoleDeleteResponse,
  PermissionDeleteResponse,
} from './types';
import { PrismaService } from '../core/config/prisma/prisma.service';

/**
 * RbacService handles role and permission management operations
 * Provides CRUD operations for roles and permissions
 * Manages role-permission assignments
 */
@Injectable()
export class RbacService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly permissionRepository: PermissionRepository,
    private readonly prisma: PrismaService,
  ) {}

  // ===========================
  // Role Management
  // ===========================

  /**
   * Create a new role
   * Validates that role name is unique before creation
   * @param createRoleDto - Role data (name, description)
   * @returns Newly created role
   * @throws ConflictException if role name already exists
   */
  async createRole(createRoleDto: CreateRoleDto): Promise<RoleWithRelations> {
    const existingRole = await this.roleRepository.findByName(
      createRoleDto.name,
    );
    if (existingRole) {
      throw new ConflictException(
        `Role with name '${createRoleDto.name}' already exists`,
      );
    }

    return this.roleRepository.create(createRoleDto);
  }

  /**
   * Get all roles
   * Returns list sorted alphabetically by name with permission counts
   * @returns Array of all roles with permissions and user count
   */
  async getAllRoles(): Promise<RoleWithRelations[]> {
    return this.roleRepository.findAll();
  }

  /**
   * Get a single role by ID
   * Includes associated permission information
   * @param id - Role ID
   * @returns Role with relations
   * @throws NotFoundException if role not found
   */
  async getRoleById(id: number): Promise<RoleWithRelations> {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  /**
   * Get a role by name
   * @param name - Role name
   * @returns Role details
   * @throws NotFoundException if role not found
   */
  async getRoleByName(name: string): Promise<RoleWithRelations> {
    const role = await this.roleRepository.findByName(name);
    if (!role) {
      throw new NotFoundException(`Role with name '${name}' not found`);
    }
    return role;
  }

  /**
   * Update a role
   * Validates uniqueness of name if being updated
   * @param id - Role ID
   * @param updateRoleDto - Updated role data
   * @returns Updated role
   * @throws NotFoundException if role not found
   * @throws ConflictException if updated name already exists
   */
  async updateRole(
    id: number,
    updateRoleDto: UpdateRoleDto,
  ): Promise<RoleWithRelations> {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Check name uniqueness if being updated
    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.roleRepository.findByName(
        updateRoleDto.name,
      );
      if (existingRole && existingRole.id !== id) {
        throw new ConflictException(
          `Role with name '${updateRoleDto.name}' already exists`,
        );
      }
    }

    return this.roleRepository.update(id, updateRoleDto);
  }

  /**
   * Delete a role
   * Prevents deletion if role has assigned users
   * @param id - Role ID
   * @returns Success message
   * @throws NotFoundException if role not found
   * @throws BadRequestException if role has assigned users
   */
  async deleteRole(id: number): Promise<RoleDeleteResponse> {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Check if role has assigned users
    const userCount = await this.prisma.userRole.count({
      where: { roleId: id },
    });

    if (userCount > 0) {
      throw new BadRequestException(
        `Cannot delete role. ${userCount} user(s) are assigned to this role. Please reassign those users first.`,
      );
    }

    await this.roleRepository.delete(id);

    return { message: 'Role deleted successfully' };
  }

  /**
   * Assign permissions to a role
   * @param roleId - Role ID
   * @param assignPermissionsDto - Permission IDs to assign
   * @returns Updated role with permissions
   * @throws NotFoundException if role or any permission not found
   */
  async assignPermissionsToRole(
    roleId: number,
    assignPermissionsDto: AssignPermissionsDto,
  ): Promise<RoleWithRelations> {
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Verify all permissions exist
    const permissions = await this.prisma.permission.findMany({
      where: {
        id: {
          in: assignPermissionsDto.permissionIds,
        },
      },
    });

    if (permissions.length !== assignPermissionsDto.permissionIds.length) {
      throw new NotFoundException('One or more permissions not found');
    }

    await this.roleRepository.assignPermissions(
      roleId,
      assignPermissionsDto.permissionIds,
    );

    return this.roleRepository.findById(roleId) as Promise<RoleWithRelations>;
  }

  /**
   * Remove permissions from a role
   * @param roleId - Role ID
   * @param permissionIds - Permission IDs to remove
   * @returns Updated role with permissions
   * @throws NotFoundException if role not found
   */
  async removePermissionsFromRole(
    roleId: number,
    permissionIds: number[],
  ): Promise<RoleWithRelations> {
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    await this.roleRepository.removePermissions(roleId, permissionIds);

    return this.roleRepository.findById(roleId) as Promise<RoleWithRelations>;
  }

  // ===========================
  // Permission Management
  // ===========================

  /**
   * Create a new permission
   * Validates that permission name is unique and follows format
   * @param createPermissionDto - Permission data (name, description)
   * @returns Newly created permission
   * @throws ConflictException if permission name already exists
   */
  async createPermission(
    createPermissionDto: CreatePermissionDto,
  ): Promise<PermissionWithRelations> {
    const existingPermission = await this.permissionRepository.findByName(
      createPermissionDto.name,
    );
    if (existingPermission) {
      throw new ConflictException(
        `Permission with name '${createPermissionDto.name}' already exists`,
      );
    }

    return this.permissionRepository.create(createPermissionDto);
  }

  /**
   * Get all permissions
   * Returns list sorted alphabetically by name with role counts
   * @returns Array of all permissions with roles
   */
  async getAllPermissions(): Promise<PermissionWithRelations[]> {
    return this.permissionRepository.findAll();
  }

  /**
   * Get a single permission by ID
   * Includes associated role information
   * @param id - Permission ID
   * @returns Permission with relations
   * @throws NotFoundException if permission not found
   */
  async getPermissionById(id: number): Promise<PermissionWithRelations> {
    const permission = await this.permissionRepository.findById(id);
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }
    return permission;
  }

  /**
   * Get a permission by name
   * @param name - Permission name
   * @returns Permission details
   * @throws NotFoundException if permission not found
   */
  async getPermissionByName(name: string): Promise<PermissionWithRelations> {
    const permission = await this.permissionRepository.findByName(name);
    if (!permission) {
      throw new NotFoundException(`Permission with name '${name}' not found`);
    }
    return permission;
  }

  /**
   * Update a permission
   * Validates uniqueness of name if being updated
   * @param id - Permission ID
   * @param updatePermissionDto - Updated permission data
   * @returns Updated permission
   * @throws NotFoundException if permission not found
   * @throws ConflictException if updated name already exists
   */
  async updatePermission(
    id: number,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<PermissionWithRelations> {
    const permission = await this.permissionRepository.findById(id);
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    // Check name uniqueness if being updated
    if (
      updatePermissionDto.name &&
      updatePermissionDto.name !== permission.name
    ) {
      const existingPermission = await this.permissionRepository.findByName(
        updatePermissionDto.name,
      );
      if (existingPermission && existingPermission.id !== id) {
        throw new ConflictException(
          `Permission with name '${updatePermissionDto.name}' already exists`,
        );
      }
    }

    return this.permissionRepository.update(id, updatePermissionDto);
  }

  /**
   * Delete a permission
   * Prevents deletion if permission is assigned to any roles
   * @param id - Permission ID
   * @returns Success message
   * @throws NotFoundException if permission not found
   * @throws BadRequestException if permission is assigned to roles
   */
  async deletePermission(id: number): Promise<PermissionDeleteResponse> {
    const permission = await this.permissionRepository.findById(id);
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    // Check if permission is assigned to any roles
    const roleCount = await this.prisma.rolePermission.count({
      where: { permissionId: id },
    });

    if (roleCount > 0) {
      throw new BadRequestException(
        `Cannot delete permission. It is assigned to ${roleCount} role(s). Please remove it from those roles first.`,
      );
    }

    await this.permissionRepository.delete(id);

    return { message: 'Permission deleted successfully' };
  }

  /**
   * Search roles or permissions
   * @param query - Search query string
   * @returns Object with matching roles and permissions
   */
  async search(query: string): Promise<{
    roles: RoleWithRelations[];
    permissions: PermissionWithRelations[];
  }> {
    const [roles, permissions] = await Promise.all([
      this.roleRepository.search(query, ['name', 'description']),
      this.permissionRepository.search(query, ['name', 'description']),
    ]);

    return { roles, permissions };
  }
}
