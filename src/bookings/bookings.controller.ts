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
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import {
  CreateBookingDto,
  UpdateBookingDto,
  CheckAvailabilityDto,
  BookingFilterDto,
  CancelBookingDto,
  UpdateBookingSettingsDto,
  CreateBlockedDateDto,
  CreateCustomScheduleDto,
} from './dtos';
import { Auth } from '../auth/decorator/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { Permissions } from '../auth/decorator/permissions.decorator';
import { ActiveUser } from '../auth/decorator/active-user.decorator';
import type { ActiveUserData } from '../auth/interfaces/active-user-data.interface';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // ===========================
  // Public Endpoints (No Auth Required)
  // ===========================

  @Get('availability')
  @Auth(AuthType.None)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check availability for a specific date and party size',
  })
  async checkAvailability(@Query() checkAvailabilityDto: CheckAvailabilityDto) {
    return this.bookingsService.checkAvailability(checkAvailabilityDto);
  }

  @Get('settings/public')
  @Auth(AuthType.None)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get public booking settings' })
  async getPublicSettings() {
    const settings = await this.bookingsService.getSettings();
    // Return only public fields
    return {
      minPartySize: settings.minPartySize,
      maxPartySize: settings.maxPartySize,
      advanceBookingDays: settings.advanceBookingDays,
      isBookingEnabled: settings.isBookingEnabled,
      requireDeposit: settings.requireDeposit,
      depositAmount: settings.depositAmount,
      depositType: settings.depositType,
      cancellationHours: settings.cancellationHours,
    };
  }

  @Post()
  @Auth(AuthType.None) // Allow both guest and authenticated users
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new booking (guest or registered user)' })
  async create(
    @Body() createBookingDto: CreateBookingDto,
    @ActiveUser() user?: ActiveUserData,
  ) {
    return this.bookingsService.createBooking(createBookingDto, user?.sub);
  }

  @Get('confirmation/:code')
  @Auth(AuthType.None)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get booking by confirmation code' })
  async findByConfirmationCode(@Param('code') code: string) {
    return this.bookingsService.findByConfirmationCode(code);
  }

  // ===========================
  // User Endpoints (Authenticated)
  // ===========================

  @Get('my-bookings')
  @Auth(AuthType.Bearer)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user bookings' })
  async getMyBookings(@ActiveUser() user: ActiveUserData) {
    return this.bookingsService.findByUser(user.sub);
  }

  @Patch(':id/cancel')
  @Auth(AuthType.Bearer)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel own booking' })
  async cancelOwnBooking(
    @Param('id', ParseIntPipe) id: number,
    @Body() cancelBookingDto: CancelBookingDto,
    @ActiveUser() user: ActiveUserData,
  ) {
    // Verify booking belongs to user
    const booking = await this.bookingsService.findOne(id);
    if (booking.userId !== user.sub) {
      throw new Error('Unauthorized');
    }

    return this.bookingsService.cancel(
      id,
      cancelBookingDto,
      `user_${user.sub}`,
    );
  }

  // ===========================
  // Admin Endpoints
  // ===========================

  @Get('admin/all')
  @Permissions('bookings:view')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all bookings with filters (Admin)' })
  async findAll(@Query() filterDto: BookingFilterDto) {
    return this.bookingsService.findAll(filterDto);
  }

  @Get('admin/:id')
  @Permissions('bookings:view')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get booking by ID (Admin)' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.findOne(id);
  }

  @Put('admin/:id')
  @Permissions('bookings:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update booking (Admin)' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBookingDto: UpdateBookingDto,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.bookingsService.update(
      id,
      updateBookingDto,
      `admin_${user.sub}`,
    );
  }

  @Patch('admin/:id/cancel')
  @Permissions('bookings:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel booking (Admin)' })
  async cancelBooking(
    @Param('id', ParseIntPipe) id: number,
    @Body() cancelBookingDto: CancelBookingDto,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.bookingsService.cancel(
      id,
      cancelBookingDto,
      `admin_${user.sub}`,
    );
  }

  @Patch('admin/:id/no-show')
  @Permissions('bookings:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark booking as no-show (Admin)' })
  async markAsNoShow(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.bookingsService.markAsNoShow(id, `admin_${user.sub}`);
  }

  @Patch('admin/:id/completed')
  @Permissions('bookings:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark booking as completed (Admin)' })
  async markAsCompleted(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.bookingsService.markAsCompleted(id, `admin_${user.sub}`);
  }

  @Delete('admin/:id')
  @Permissions('bookings:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete booking (Admin)' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.bookingsService.delete(id);
    return { message: 'Booking deleted successfully' };
  }

  // ===========================
  // Settings Management (Admin)
  // ===========================

  @Get('admin/settings/details')
  @Permissions('bookings:manage-settings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get full booking settings (Admin)' })
  async getSettings() {
    return this.bookingsService.getSettings();
  }

  @Put('admin/settings')
  @Permissions('bookings:manage-settings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update booking settings (Admin)' })
  async updateSettings(@Body() updateSettingsDto: UpdateBookingSettingsDto) {
    return this.bookingsService.updateSettings(updateSettingsDto);
  }

  // ===========================
  // Blocked Dates Management (Admin)
  // ===========================

  @Get('admin/blocked-dates')
  @Permissions('bookings:manage-settings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all blocked dates (Admin)' })
  async getAllBlockedDates() {
    return this.bookingsService.getAllBlockedDates();
  }

  @Post('admin/blocked-dates')
  @Permissions('bookings:manage-settings')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create blocked date (Admin)' })
  async createBlockedDate(@Body() createBlockedDateDto: CreateBlockedDateDto) {
    return this.bookingsService.createBlockedDate(createBlockedDateDto);
  }

  @Delete('admin/blocked-dates/:id')
  @Permissions('bookings:manage-settings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete blocked date (Admin)' })
  async deleteBlockedDate(@Param('id', ParseIntPipe) id: number) {
    await this.bookingsService.deleteBlockedDate(id);
    return { message: 'Blocked date deleted successfully' };
  }

  // ===========================
  // Custom Schedules Management (Admin)
  // ===========================

  @Get('admin/custom-schedules')
  @Permissions('bookings:manage-settings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all custom schedules (Admin)' })
  async getAllCustomSchedules() {
    return this.bookingsService.getAllCustomSchedules();
  }

  @Post('admin/custom-schedules')
  @Permissions('bookings:manage-settings')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create custom schedule (Admin)' })
  async createCustomSchedule(
    @Body() createCustomScheduleDto: CreateCustomScheduleDto,
  ) {
    return this.bookingsService.createCustomSchedule(createCustomScheduleDto);
  }

  @Delete('admin/custom-schedules/:id')
  @Permissions('bookings:manage-settings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete custom schedule (Admin)' })
  async deleteCustomSchedule(@Param('id', ParseIntPipe) id: number) {
    await this.bookingsService.deleteCustomSchedule(id);
    return { message: 'Custom schedule deleted successfully' };
  }
}
