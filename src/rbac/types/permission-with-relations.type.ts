import { Permission, Role } from '@/generated/prisma/client';

/**
 * Permission with related role information
 */
export type PermissionWithRelations = Permission & {
  rolePermissions?: Array<{
    role: Role;
    assignedAt: Date;
  }>;
  _count?: {
    rolePermissions: number;
  };
};

/**
 * Simplified permission with roles array
 */
export type PermissionWithRoles = Permission & {
  roles: Role[];
  roleCount?: number;
};

/**
 * Response type for permission deletion
 */
export type PermissionDeleteResponse = {
  message: string;
};
