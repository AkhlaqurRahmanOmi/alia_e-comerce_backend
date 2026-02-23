import { Role, Permission } from '@/generated/prisma/client';

/**
 * Role with related permission information
 */
export type RoleWithRelations = Role & {
  rolePermissions?: Array<{
    permission: Permission;
    assignedAt: Date;
  }>;
  _count?: {
    userRoles: number;
    rolePermissions: number;
  };
};

/**
 * Simplified role with permissions array
 */
export type RoleWithPermissions = Role & {
  permissions: Permission[];
  userCount?: number;
};

/**
 * Response type for role deletion
 */
export type RoleDeleteResponse = {
  message: string;
};
