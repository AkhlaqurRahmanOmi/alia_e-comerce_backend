import {
  Injectable,
  ConflictException,
  RequestTimeoutException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { HashingProvider } from 'src/auth/providers/hashing.provider';
import { PasswordResetProvider } from 'src/auth/providers/password-reset.provider';
import { UserWithRoles } from './types/user-with-relations.type';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PaginatedResult } from 'src/shared/types';
import { randomBytes } from 'crypto';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,

    @Inject(forwardRef(() => HashingProvider))
    private readonly hashingProvider: HashingProvider,

    @Inject(forwardRef(() => PasswordResetProvider))
    private readonly passwordResetProvider: PasswordResetProvider,
  ) {}

  /**
   * Create a new user with hashed password (isVerified = false by default)
   */
  public async createUser(createUserDto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    try {
      // Check if user exists
      const existingUser = await this.userRepository.findByEmail(
        createUserDto.email,
      );

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Hash the password
      const hashedPassword = await this.hashingProvider.hashPassword(
        createUserDto.password,
      );

      // Create the user (isVerified will be false by default from schema)
      const user = await this.userRepository.create({
        email: createUserDto.email,
        password: hashedPassword,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
      });

      return user;
    } catch (error) {
      throw new ConflictException(error, {
        description: 'Unable to create user',
      });
    }
  }

  /**
   * Create a Google user without password
   */
  public async createGoogleUser(googleUserDto: {
    email: string;
    firstName: string;
    lastName: string;
    googleId: string;
  }) {
    try {
      // Check if user exists with email or googleId
      const existingUserByEmail = await this.userRepository.findByEmail(
        googleUserDto.email,
      );
      const existingUserByGoogleId = await this.userRepository.findByGoogleId(
        googleUserDto.googleId,
      );

      if (existingUserByEmail || existingUserByGoogleId) {
        throw new ConflictException('User already exists');
      }

      // Create the user
      const user = await this.userRepository.create({
        email: googleUserDto.email,
        firstName: googleUserDto.firstName,
        lastName: googleUserDto.lastName,
        googleId: googleUserDto.googleId,
        isVerified: true,
        verifiedAt: new Date(),
      });

      return user;
    } catch (error) {
      throw new ConflictException(error, {
        description: 'Unable to create Google user',
      });
    }
  }

  /**
   * Find user by ID
   */
  public async findOne(id: number): Promise<UserWithRoles | null> {
    try {
      return await this.userRepository.findByIdWithRoles(id);
    } catch (error) {
      throw new RequestTimeoutException(
        'Unable to process your request at the moment, please try later',
        {
          description: 'Error connecting to database',
        },
      );
    }
  }

  /**
   * Find user by email
   */
  public async findOneByEmail(email: string) {
    try {
      return await this.userRepository.findByEmail(email);
    } catch (error) {
      throw new RequestTimeoutException(
        'Unable to process your request at the moment, please try later',
        {
          description: 'Error connecting to database',
        },
      );
    }
  }

  /**
   * Find user by Google ID
   */
  public async findOneByGoogleId(googleId: string) {
    try {
      return await this.userRepository.findByGoogleId(googleId);
    } catch (error) {
      throw new RequestTimeoutException(
        'Unable to process your request at the moment, please try later',
        {
          description: 'Error connecting to database',
        },
      );
    }
  }

  /**
   * Find all users with pagination and filters
   */
  public async findAll(filterDto?: {
    page?: number;
    limit?: number;
    search?: string;
    isVerified?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResult<UserWithRoles>> {
    try {
      const queryOptions: any = {
        pagination: {
          page: filterDto?.page || 1,
          limit: filterDto?.limit || 10,
        },
        filters: {},
      };

      // Add search filter
      if (filterDto?.search) {
        queryOptions.search = {
          query: filterDto.search,
          fields: ['email', 'firstName', 'lastName'],
        };
        queryOptions.filters = {
          OR: [
            { email: { contains: filterDto.search, mode: 'insensitive' } },
            { firstName: { contains: filterDto.search, mode: 'insensitive' } },
            { lastName: { contains: filterDto.search, mode: 'insensitive' } },
          ],
        };
      }

      // Add isVerified filter
      if (filterDto?.isVerified !== undefined) {
        queryOptions.filters.isVerified = filterDto.isVerified;
      }

      // Add sorting
      if (filterDto?.sortBy) {
        queryOptions.sort = {
          field: filterDto.sortBy,
          order: filterDto.sortOrder || 'asc',
        };
      }

      return await this.userRepository.findWithFilters(queryOptions);
    } catch (error) {
      throw new RequestTimeoutException(
        'Unable to process your request at the moment, please try later',
        {
          description: 'Error connecting to database',
        },
      );
    }
  }

  /**
   * Find user with roles and permissions
   */

  private userRoleCacheKey(id: number) {
    return `user_roles_permissions:${id}`;
  }
  public async findUserWithRoles(id: number): Promise<UserWithRoles | null> {
    const key = this.userRoleCacheKey(id);

    //Try cache
    const cached = await this.cache.get<UserWithRoles>(key);
    if (cached) return cached;
    try {
      const user = await this.userRepository.findByIdWithRoles(id);
      if (user) {
        await this.cache.set(key, user, 120_000); //2 minutes in ms
      }
      return user;
    } catch (error) {
      throw new RequestTimeoutException(
        'Unable to process your request at the moment, please try later',
        {
          description: 'Error connecting to database',
        },
      );
    }
  }

  public async invalidateUserRoleCache(id: number) {
    const key = this.userRoleCacheKey(id);
    await this.cache.del(key);
  }

  /**
   * Update user information
   */
  public async updateUser(
    id: number,
    updateUserDto: {
      email?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
    },
  ) {
    try {
      // Check if user exists
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new ConflictException('User not found');
      }

      // If email is being updated, check if it's already in use
      if (updateUserDto.email && updateUserDto.email !== user.email) {
        const existingUser = await this.userRepository.findByEmail(
          updateUserDto.email,
        );
        if (existingUser) {
          throw new ConflictException('Email is already in use');
        }
      }

      // Hash password if it's being updated
      const updateData: any = { ...updateUserDto };
      if (updateUserDto.password) {
        updateData.password = await this.hashingProvider.hashPassword(
          updateUserDto.password,
        );
      }

      // Update user
      const updatedUser = await this.userRepository.update(id, updateData);
      return updatedUser;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new RequestTimeoutException(
        'Unable to process your request at the moment, please try later',
        {
          description: 'Error updating user',
        },
      );
    }
  }

  /**
   * Delete user
   */
  public async deleteUser(id: number) {
    try {
      // Check if user exists
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new ConflictException('User not found');
      }

      // Delete user
      await this.userRepository.delete(id);

      return { message: 'User deleted successfully' };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new RequestTimeoutException(
        'Unable to process your request at the moment, please try later',
        {
          description: 'Error deleting user',
        },
      );
    }
  }

  /**
   * Update user verification status (Admin only)
   */
  public async updateVerificationStatus(id: number, isVerified: boolean) {
    try {
      // Check if user exists
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new ConflictException('User not found');
      }

      // Update verification status
      const updateData: any = {
        isVerified,
        verifiedAt: isVerified ? new Date() : null,
      };

      const updatedUser = await this.userRepository.update(id, updateData);

      // Invalidate cache when verification status changes
      await this.invalidateUserRoleCache(id);

      return updatedUser;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new RequestTimeoutException(
        'Unable to process your request at the moment, please try later',
        {
          description: 'Error updating verification status',
        },
      );
    }
  }

  /**
   * Create a new user by admin with optional password
   * If password is not provided, sends a setup email
   */
  public async createUserByAdmin(adminCreateUserDto: {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    sendSetPasswordEmail?: boolean;
  }) {
    try {
      // Check if user exists
      const existingUser = await this.userRepository.findByEmail(
        adminCreateUserDto.email,
      );

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      let hashedPassword: string;
      const shouldSendSetupEmail =
        !adminCreateUserDto.password || adminCreateUserDto.sendSetPasswordEmail;

      // If no password provided, generate a random one (user will set their own via email)
      if (!adminCreateUserDto.password) {
        const randomPassword = randomBytes(32).toString('hex');
        hashedPassword =
          await this.hashingProvider.hashPassword(randomPassword);
      } else {
        hashedPassword = await this.hashingProvider.hashPassword(
          adminCreateUserDto.password,
        );
      }

      // Prepare user data
      const userData: any = {
        email: adminCreateUserDto.email,
        password: hashedPassword,
        firstName: adminCreateUserDto.firstName,
        lastName: adminCreateUserDto.lastName,
        // User is not verified until they set their password (if no password provided)
        // Or verified immediately if admin provided password
        isVerified: !!adminCreateUserDto.password,
      };

      // Set verifiedAt if user is being created with password
      if (userData.isVerified) {
        userData.verifiedAt = new Date();
      }

      // Create the user
      const user = await this.userRepository.create(userData);

      // If no password was provided or admin wants to send setup email, generate token and send email
      if (shouldSendSetupEmail) {
        const token =
          await this.passwordResetProvider.generateAccountSetupToken(user.id);
        await this.passwordResetProvider.sendAccountSetupEmail(
          user.id,
          user.email,
          user.firstName,
          token,
        );
      }

      return {
        ...user,
        setupEmailSent: shouldSendSetupEmail,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new ConflictException(error, {
        description: 'Unable to create user',
      });
    }
  }
}
