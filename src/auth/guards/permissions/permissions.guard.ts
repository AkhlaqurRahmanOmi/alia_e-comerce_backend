import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from 'src/auth/decorator/permissions.decorator';
import { ROLES_KEY } from 'src/auth/decorator/roles.decorator';
import { REQUEST_USER_KEY } from 'src/auth/constants/auth.constants';
import { UserService } from 'src/user/user.service';
import { UserWithRoles } from 'src/user/types/user-with-relations.type';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required roles and permissions from decorators
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles or permissions are required, allow access
    if (
      (!requiredRoles || requiredRoles.length === 0) &&
      (!requiredPermissions || requiredPermissions.length === 0)
    ) {
      return true;
    }

    // Get user from request
    const request = context.switchToHttp().getRequest();
    const user = request[REQUEST_USER_KEY];

    if (!user || !user.sub) {
      throw new ForbiddenException('User not authenticated');
    }

    // Fetch user with roles and permissions
    const userWithRoles = await this.userService.findUserWithRoles(user.sub);

    if (!userWithRoles) {
      throw new ForbiddenException('User not found');
    }

    // Extract user's roles and permissions
    const userRoles = new Set<string>();
    const userPermissions = new Set<string>();

    userWithRoles.userRoles.forEach((userRole) => {
      // Add role name
      userRoles.add(userRole.role.name);

      // Add permissions from this role
      userRole.role.rolePermissions.forEach((rolePermission) => {
        userPermissions.add(rolePermission.permission.name);
      });
    });

    // Check roles (if specified)
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some((role) => userRoles.has(role));

      if (!hasRequiredRole) {
        throw new ForbiddenException(
          `Access denied. Required roles: ${requiredRoles.join(', ')}`,
        );
      }
    }

    // Check permissions (if specified)
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every((permission) =>
        userPermissions.has(permission),
      );

      if (!hasAllPermissions) {
        throw new ForbiddenException(
          'You do not have the required permissions to access this resource',
        );
      }
    }

    return true;
  }
}
