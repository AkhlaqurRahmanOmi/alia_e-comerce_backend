import {
  Inject,
  Injectable,
  RequestTimeoutException,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { SignInDto } from '../dtos/signin.dto';
import { HashingProvider } from './hashing.provider';
import { GenerateTokenProvider } from './generate-token.provider';
import { FormattedRole } from 'src/user/types/user-with-relations.type';

@Injectable()
export class SignInProvider {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,

    private readonly hashingProvider: HashingProvider,

    private readonly generateTokenProvider: GenerateTokenProvider,
  ) {}

  public async signIn(signInDto: SignInDto) {
    const user = await this.userService.findOneByEmail(signInDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    let isEqual: boolean = false;

    try {
      isEqual = await this.hashingProvider.comparePassword(
        signInDto.password,
        user.password,
      );
    } catch (error) {
      throw new RequestTimeoutException(error, {
        description: 'Could not compare passwords',
      });
    }

    if (!isEqual) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Fetch user with roles and permissions
    const userWithRoles = await this.userService.findUserWithRoles(user.id);

    if (!userWithRoles) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Extract roles from userRoles relation
    const roles: FormattedRole[] = userWithRoles.userRoles.map((userRole) => ({
      id: userRole.role.id,
      name: userRole.role.name,
      description: userRole.role.description,
      permissions: userRole.role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
      })),
    }));

    // Generate tokens with role information
    const tokens = await this.generateTokenProvider.generateTokens(userWithRoles);

    // Return tokens along with user details, roles, and addresses
    return {
      ...tokens,
      user: {
        id: userWithRoles.id,
        email: userWithRoles.email,
        firstName: userWithRoles.firstName,
        lastName: userWithRoles.lastName,
        isVerified: userWithRoles.isVerified,
        userAddresses: userWithRoles.userAddresses,
      },
      roles,
    };
  }
}
