import { User, Role, Permission, UserAddress } from '@prisma/client';

// Type for Role with its permissions
export type RoleWithPermissions = Role & {
  rolePermissions: Array<{
    permission: Permission;
  }>;
};

// Type for UserRole with nested Role and Permissions
export type UserRoleWithRelations = {
  role: RoleWithPermissions;
};

// Type for User with roles and permissions
export type UserWithRoles = User & {
  userRoles: UserRoleWithRelations[];
  userAddresses: UserAddress[];
};

// Type for the formatted role response
export interface FormattedRole {
  id: number;
  name: string;
  description: string | null;
  permissions: FormattedPermission[];
}

// Type for the formatted permission response
export interface FormattedPermission {
  id: number;
  name: string;
  description: string | null;
}
