import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Auth } from '../auth/decorator/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { Permissions } from '../auth/decorator/permissions.decorator';
import { CacheTTL } from '../shared/decorators/cache-ttl.decorator';

import { CountryService } from './country.service';
import { CreateCountryDto, UpdateCountryDto, CountryFilterDto } from './dtos';

@ApiTags('Countries')
@Controller('countries')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  // ===========================
  // Public Endpoints
  // ===========================

  /**
   * Get all countries
   * Returns list of active countries with product count
   * Cached for 10 minutes
   */
  @Get()
  @Auth(AuthType.None)
  @CacheTTL(600000)
  @HttpCode(HttpStatus.OK)
  async getAllCountries() {
    return this.countryService.getAllCountries();
  }

  /**
   * Get countries with filters
   * Returns paginated and filtered list of countries
   * Supports filtering by isActive status for admin users
   */
  @ApiOperation({ summary: 'Get countries with filters' })
  @ApiResponse({ status: 200, description: 'Countries retrieved successfully' })
  @Get('filter')
  @Auth(AuthType.None)
  @CacheTTL(300000)
  @HttpCode(HttpStatus.OK)
  async getCountriesWithFilters(@Query() filters: CountryFilterDto) {
    return this.countryService.getCountriesWithFilters(filters);
  }

  /**
   * Get all countries including inactive (Admin only)
   * Returns complete list for admin management
   * Requires 'countries:read' permission
   */
  @Get('admin/all')
  @Permissions('countries:read')
  @HttpCode(HttpStatus.OK)
  async getAllCountriesForAdmin() {
    return this.countryService.getAllCountriesForAdmin();
  }

  /**
   * Search countries by name or code
   * Public endpoint for searching countries
   * Cached for 5 minutes
   */
  @Get('search')
  @Auth(AuthType.None)
  @CacheTTL(300000)
  @HttpCode(HttpStatus.OK)
  async searchCountries(@Query('q') query: string) {
    return this.countryService.searchCountries(query);
  }

  /**
   * Get total count of countries
   * Returns the total number of active countries in the system
   * Cached for 10 minutes
   */
  @Get('count')
  @Auth(AuthType.None)
  @CacheTTL(600000)
  @HttpCode(HttpStatus.OK)
  async getCountriesCount() {
    return this.countryService.getCountriesCount();
  }

  /**
   * Get total count of all countries including inactive (Admin only)
   * Returns the total number of all countries in the system
   * Requires 'countries:read' permission
   */
  @Get('admin/count')
  @Permissions('countries:read')
  @HttpCode(HttpStatus.OK)
  async getAllCountriesCount() {
    return this.countryService.getAllCountriesCount();
  }

  /**
   * Get country by ISO code
   * Fetch country details using 2-letter ISO code (e.g., FR, IT, ES)
   * Cached for 10 minutes
   */
  @Get('code/:code')
  @Auth(AuthType.None)
  @CacheTTL(600000)
  @HttpCode(HttpStatus.OK)
  async getCountryByCode(@Param('code') code: string) {
    return this.countryService.getCountryByCode(code.toUpperCase());
  }

  /**
   * Get country by ID
   * Fetch country details including associated products
   * Cached for 10 minutes
   */
  @Get(':id')
  @Auth(AuthType.None)
  @CacheTTL(600000)
  @HttpCode(HttpStatus.OK)
  async getCountryById(@Param('id', ParseIntPipe) id: number) {
    return this.countryService.getCountryById(id);
  }

  // ===========================
  // Admin Endpoints
  // ===========================

  /**
   * Create a new country
   * Admin endpoint to add a new country to the system
   * Requires 'countries:create' permission
   */
  @Post()
  @Permissions('countries:create')
  @HttpCode(HttpStatus.CREATED)
  async createCountry(@Body() createCountryDto: CreateCountryDto) {
    return this.countryService.createCountry(createCountryDto);
  }

  /**
   * Update an existing country
   * Admin endpoint to modify country details
   * Requires 'countries:update' permission
   */
  @Patch(':id')
  @Permissions('countries:update')
  @HttpCode(HttpStatus.OK)
  async updateCountry(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCountryDto: UpdateCountryDto,
  ) {
    return this.countryService.updateCountry(id, updateCountryDto);
  }

  /**
   * Toggle country active status
   * Admin endpoint to activate/deactivate a country
   * Requires 'countries:update' permission
   */
  @ApiOperation({ summary: 'Toggle country active status' })
  @ApiParam({ name: 'id', description: 'Country ID' })
  @ApiResponse({ status: 200, description: 'Country status toggled successfully' })
  @ApiResponse({ status: 404, description: 'Country not found' })
  @Patch(':id/toggle-status')
  @Permissions('countries:update')
  @HttpCode(HttpStatus.OK)
  async toggleCountryStatus(@Param('id', ParseIntPipe) id: number) {
    return this.countryService.toggleCountryStatus(id);
  }

  /**
   * Delete a country
   * Admin endpoint to remove a country from the system
   * Cannot delete if country has associated products
   * Requires 'countries:delete' permission
   */
  @Delete(':id')
  @Permissions('countries:delete')
  @HttpCode(HttpStatus.OK)
  async deleteCountry(@Param('id', ParseIntPipe) id: number) {
    return this.countryService.deleteCountry(id);
  }
}
