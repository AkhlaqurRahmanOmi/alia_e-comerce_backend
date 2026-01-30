import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserFilterDto } from './dtos/user-filter.dto';
import { UpdateVerificationStatusDto } from './dtos/update-verification-status.dto';
import { AdminCreateUserDto } from './dtos/admin-create-user.dto';
import { CreateAddressDto } from './dtos/create-address.dto';
import { UpdateAddressDto } from './dtos/update-address.dto';
import { Auth } from 'src/auth/decorator/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import { ActiveUser } from 'src/auth/decorator/active-user.decorator';
import type { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { Permissions } from 'src/auth/decorator/permissions.decorator';
import { UserAddressProvider } from './providers/user-address.provider';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userAddressProvider: UserAddressProvider,
  ) {}

  @Post()
  @Permissions('users:create')
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.CREATED)
  public async createUser(@Body() adminCreateUserDto: AdminCreateUserDto) {
    return this.userService.createUserByAdmin(adminCreateUserDto);
  }

  @Get('profile')
  public async getProfile(@ActiveUser() user: ActiveUserData) {
    return this.userService.findOne(user.sub);
  }

  @Get('all')
  @Permissions('users:view')
  public async getAllUsers(@Query() filterDto: UserFilterDto) {
    return this.userService.findAll(filterDto);
  }

  @Auth(AuthType.None)

  @Get(':id')
  // @Permissions('users:view')
  @UseInterceptors(ClassSerializerInterceptor)
  public async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Put(':id')
  @Permissions('users:update')
  @UseInterceptors(ClassSerializerInterceptor)
  public async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @ActiveUser() user: ActiveUserData,
  ) {
    // Users can only update their own profile unless they have admin permission
    if (id !== user.sub) {
      throw new Error('Forbidden: You can only update your own profile');
    }
    return this.userService.updateUser(id, updateUserDto);
  }

  @Patch(':id')
  @Permissions('users:update')
  @UseInterceptors(ClassSerializerInterceptor)
  public async patchUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @ActiveUser() user: ActiveUserData,
  ) {
    // Users can only update their own profile unless they have admin permission
    if (id !== user.sub) {
      throw new Error('Forbidden: You can only update your own profile');
    }
    return this.userService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @Permissions('users:delete')
  @HttpCode(HttpStatus.OK)
  public async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserData,
  ) {
    // Users can only delete their own account unless they have admin permission
    if (id !== user.sub) {
      throw new Error('Forbidden: You can only delete your own account');
    }
    return this.userService.deleteUser(id);
  }

  @Patch(':id/verification-status')
  @Permissions('users:update')
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  public async updateVerificationStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVerificationStatusDto: UpdateVerificationStatusDto,
  ) {
    return this.userService.updateVerificationStatus(
      id,
      updateVerificationStatusDto.isVerified,
    );
  }

  // ============================================
  // ADDRESS MANAGEMENT ENDPOINTS
  // ============================================

  @Post('addresses')
  @HttpCode(HttpStatus.CREATED)
  public async createAddress(
    @ActiveUser() user: ActiveUserData,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    return this.userAddressProvider.createAddress(user.sub, createAddressDto);
  }

  @Get('addresses')
  public async getUserAddresses(@ActiveUser() user: ActiveUserData) {
    return this.userAddressProvider.getUserAddresses(user.sub);
  }

  @Get('addresses/:id')
  public async getAddressById(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.userAddressProvider.getAddressById(id, user.sub);
  }

  @Patch('addresses/:id')
  public async updateAddress(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserData,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.userAddressProvider.updateAddress(id, user.sub, updateAddressDto);
  }

  @Delete('addresses/:id')
  @HttpCode(HttpStatus.OK)
  public async deleteAddress(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserData,
  ) {
    await this.userAddressProvider.deleteAddress(id, user.sub);
    return { message: 'Address deleted successfully' };
  }

  @Patch('addresses/:id/default-billing')
  @HttpCode(HttpStatus.OK)
  public async setDefaultBilling(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.userAddressProvider.setDefaultBilling(id, user.sub);
  }

  @Patch('addresses/:id/default-shipping')
  @HttpCode(HttpStatus.OK)
  public async setDefaultShipping(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.userAddressProvider.setDefaultShipping(id, user.sub);
  }
}
