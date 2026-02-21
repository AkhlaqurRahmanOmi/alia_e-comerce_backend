import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from '../config/jwt.config';
import type { ConfigType } from '@nestjs/config';

@Injectable()
export class GenerateTokenProvider {
  constructor(
    private readonly jwtService: JwtService,

    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  public async signToken<T>(userId: number, expiresIn: number, payload?: T) {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.secret,
        expiresIn: expiresIn,
      },
    );
  }

  public async generateTokens(user: {
    id: number;
    email: string;
    userRoles?: Array<{
      role: {
        name: string;
        rolePermissions: Array<{
          permission: { name: string };
        }>;
      };
    }>;
  }) {
    const roles = user.userRoles?.map((ur) => ur.role.name) || [];

    // Extract permissions
    const permissions =
      user.userRoles?.flatMap((ur) =>
        ur.role.rolePermissions.map((rp) => rp.permission.name),
      ) || [];

    const [accessToken, refreshToken] = await Promise.all([
      this.signToken<
        Partial<{ email: string; roles: string[]; permissions: string[] }>
      >(user.id, this.jwtConfiguration.accessTokenTtl, {
        email: user.email,
        roles,
        permissions,
      }),
      this.signToken(user.id, this.jwtConfiguration.refreshTokenTtl),
    ]);
    return { accessToken, refreshToken };
  }
}
