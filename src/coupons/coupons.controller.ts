import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import {
  CreateCouponDto,
  UpdateCouponDto,
  ValidateCouponDto,
  ApplyCouponDto,
  CouponFilterDto,
  AssignProductsDto,
  AssignCategoriesDto,
  AssignUsersDto,
} from './dtos';
import { Auth } from '../auth/decorator/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { Permissions } from '../auth/decorator/permissions.decorator';
import { ActiveUser } from '../auth/decorator/active-user.decorator';
import type { ActiveUserData } from '../auth/interfaces/active-user-data.interface';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  // ===========================
  // Admin Endpoints
  // ===========================

  @Post()
  @Permissions('coupons:create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCouponDto: CreateCouponDto) {
    return this.couponsService.create(createCouponDto);
  }

  @Get('all')
  @Permissions('coupons:view')
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() filterDto: CouponFilterDto) {
    return this.couponsService.findAll(filterDto);
  }

  @Get(':id')
  @Permissions('coupons:view')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.couponsService.findOne(id);
  }

  @Put(':id')
  @Permissions('coupons:update')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCouponDto: UpdateCouponDto,
  ) {
    return this.couponsService.update(id, updateCouponDto);
  }

  @Delete(':id')
  @Permissions('coupons:delete')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.couponsService.remove(id);
  }

  @Patch(':id/activate')
  @Permissions('coupons:update')
  @HttpCode(HttpStatus.OK)
  async activate(@Param('id', ParseIntPipe) id: number) {
    return this.couponsService.activate(id);
  }

  @Patch(':id/deactivate')
  @Permissions('coupons:update')
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.couponsService.deactivate(id);
  }

  // ===========================
  // Assignment Endpoints
  // ===========================

  @Post(':id/products')
  @Permissions('coupons:assign')
  @HttpCode(HttpStatus.OK)
  async assignToProducts(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignProductsDto: AssignProductsDto,
  ) {
    return this.couponsService.assignToProducts(id, assignProductsDto);
  }

  @Delete(':id/products/batch')
  @Permissions('coupons:assign')
  @HttpCode(HttpStatus.OK)
  async removeFromProducts(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignProductsDto: AssignProductsDto,
  ) {
    return this.couponsService.removeFromProducts(
      id,
      assignProductsDto.productIds,
    );
  }

  @Delete(':id/products/:productId')
  @Permissions('coupons:assign')
  @HttpCode(HttpStatus.OK)
  async removeFromProduct(
    @Param('id', ParseIntPipe) id: number,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.couponsService.removeFromProducts(id, [productId]);
  }

  @Post(':id/categories')
  @Permissions('coupons:assign')
  @HttpCode(HttpStatus.OK)
  async assignToCategories(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignCategoriesDto: AssignCategoriesDto,
  ) {
    return this.couponsService.assignToCategories(id, assignCategoriesDto);
  }

  @Delete(':id/categories/batch')
  @Permissions('coupons:assign')
  @HttpCode(HttpStatus.OK)
  async removeFromCategories(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignCategoriesDto: AssignCategoriesDto,
  ) {
    return this.couponsService.removeFromCategories(
      id,
      assignCategoriesDto.categoryIds,
    );
  }

  @Delete(':id/categories/:categoryId')
  @Permissions('coupons:assign')
  @HttpCode(HttpStatus.OK)
  async removeFromCategory(
    @Param('id', ParseIntPipe) id: number,
    @Param('categoryId', ParseIntPipe) categoryId: number,
  ) {
    return this.couponsService.removeFromCategories(id, [categoryId]);
  }

  @Post(':id/users')
  @Permissions('coupons:assign')
  @HttpCode(HttpStatus.OK)
  async assignToUsers(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignUsersDto: AssignUsersDto,
  ) {
    return this.couponsService.assignToUsers(id, assignUsersDto);
  }

  @Delete(':id/users/batch')
  @Permissions('coupons:assign')
  @HttpCode(HttpStatus.OK)
  async removeFromUsers(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignUsersDto: AssignUsersDto,
  ) {
    return this.couponsService.removeFromUsers(id, assignUsersDto.userIds);
  }

  @Delete(':id/users/:userId')
  @Permissions('coupons:assign')
  @HttpCode(HttpStatus.OK)
  async removeFromUser(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.couponsService.removeFromUsers(id, [userId]);
  }

  // ===========================
  // Analytics Endpoints
  // ===========================

  @Get(':id/redemptions')
  @Permissions('coupons:view')
  @HttpCode(HttpStatus.OK)
  async getRedemptionHistory(@Param('id', ParseIntPipe) id: number) {
    return this.couponsService.getRedemptionHistory(id);
  }

  @Get(':id/stats')
  @Permissions('coupons:view')
  @HttpCode(HttpStatus.OK)
  async getStatistics(@Param('id', ParseIntPipe) id: number) {
    return this.couponsService.getStatistics(id);
  }

  // ===========================
  // Customer Endpoints
  // ===========================

  @Post('validate')
  @Auth(AuthType.Bearer)
  @HttpCode(HttpStatus.OK)
  async validateCoupon(
    @Body() validateCouponDto: ValidateCouponDto,
    @ActiveUser() user: ActiveUserData,
  ) {
    // Add user ID to validation
    const validationDto = {
      ...validateCouponDto,
      userId: user.sub,
    };
    return this.couponsService.validateCoupon(validationDto);
  }

  @Post('apply')
  @Auth(AuthType.Bearer)
  @HttpCode(HttpStatus.OK)
  async applyCoupon(
    @Body() applyCouponDto: ApplyCouponDto,
    @ActiveUser() user: ActiveUserData,
  ) {
    // Note: orderAmount and shippingAmount should be passed in the DTO
    // This is a simplified version - you may want to fetch cart details here
    const orderAmount = 100; // Replace with actual cart total
    const shippingAmount = 10; // Replace with actual shipping cost

    return this.couponsService.applyCoupon(
      applyCouponDto,
      user.sub,
      orderAmount,
      shippingAmount,
    );
  }

  @Get('my-coupons')
  @Auth(AuthType.Bearer)
  @HttpCode(HttpStatus.OK)
  async getUserCoupons(@ActiveUser() user: ActiveUserData) {
    return this.couponsService.getUserCoupons(user.sub);
  }
}
