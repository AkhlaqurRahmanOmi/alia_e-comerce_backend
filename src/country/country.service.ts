import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CountryRepository } from './repositories';
import { CreateCountryDto, UpdateCountryDto } from './dtos';
import {
  CountryWithRelations,
  CountryDeleteResponse,
  CountryCountResponse,
} from './types';
import { CountryFilterDto } from './dtos';
import { PrismaService } from '../core/config/prisma/prisma.service';
import { PaginatedResult } from '../shared/types';

/**
 * CountryService handles country management operations
 * Provides CRUD operations for wine origin countries
 * Validates business rules and coordinates with repository
 */
@Injectable()
export class CountryService {
  constructor(
    private readonly countryRepository: CountryRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Create a new country
   * Validates that code and name are unique before creation
   * @param createCountryDto - Country data (code, name)
   * @returns Newly created country
   * @throws ConflictException if code or name already exists
   */
  async createCountry(
    createCountryDto: CreateCountryDto,
  ): Promise<CountryWithRelations> {
    // Check if country code already exists
    const existingCode = await this.countryRepository.findByCode(
      createCountryDto.code,
    );
    if (existingCode) {
      throw new ConflictException(
        `Country with code '${createCountryDto.code}' already exists`,
      );
    }

    // Check if country name already exists
    const existingName = await this.countryRepository.findByName(
      createCountryDto.name,
    );
    if (existingName) {
      throw new ConflictException(
        `Country with name '${createCountryDto.name}' already exists`,
      );
    }

    return this.countryRepository.create(createCountryDto);
  }

  /**
   * Get all countries
   * Returns list sorted alphabetically by name with product counts
   * @returns Array of all countries with product count
   */
  async getAllCountries(): Promise<CountryWithRelations[]> {
    return this.countryRepository.findAll();
  }

  /**
   * Get all countries including inactive ones (Admin only)
   * Returns complete list for admin management
   * @returns Array of all countries including inactive ones
   */
  async getAllCountriesForAdmin(): Promise<CountryWithRelations[]> {
    return this.countryRepository.findAllWithInactive();
  }

  /**
   * Get a single country by ID
   * Includes associated product information
   * @param id - Country ID
   * @returns Country with relations
   * @throws NotFoundException if country not found
   */
  async getCountryById(id: number): Promise<CountryWithRelations> {
    const country = await this.countryRepository.findById(id);
    if (!country) {
      throw new NotFoundException(`Country with ID ${id} not found`);
    }
    return country;
  }

  /**
   * Get a country by ISO code
   * Fetches country using 2-letter ISO code (e.g., FR, IT, ES)
   * @param code - ISO 3166-1 alpha-2 country code
   * @returns Country details
   * @throws NotFoundException if country not found
   */
  async getCountryByCode(code: string): Promise<CountryWithRelations> {
    const country = await this.countryRepository.findByCode(code);
    if (!country) {
      throw new NotFoundException(`Country with code '${code}' not found`);
    }
    return country;
  }

  /**
   * Update a country
   * Validates uniqueness of code and name if being updated
   * @param id - Country ID
   * @param updateCountryDto - Updated country data
   * @returns Updated country
   * @throws NotFoundException if country not found
   * @throws ConflictException if updated code or name already exists
   */
  async updateCountry(
    id: number,
    updateCountryDto: UpdateCountryDto,
  ): Promise<CountryWithRelations> {
    const country = await this.countryRepository.findById(id);
    if (!country) {
      throw new NotFoundException(`Country with ID ${id} not found`);
    }

    // Check code uniqueness if being updated
    if (updateCountryDto.code && updateCountryDto.code !== country.code) {
      const existingCode = await this.countryRepository.findByCode(
        updateCountryDto.code,
      );
      if (existingCode && existingCode.id !== id) {
        throw new ConflictException(
          `Country with code '${updateCountryDto.code}' already exists`,
        );
      }
    }

    // Check name uniqueness if being updated
    if (updateCountryDto.name && updateCountryDto.name !== country.name) {
      const existingName = await this.countryRepository.findByName(
        updateCountryDto.name,
      );
      if (existingName && existingName.id !== id) {
        throw new ConflictException(
          `Country with name '${updateCountryDto.name}' already exists`,
        );
      }
    }

    return this.countryRepository.update(id, updateCountryDto);
  }

  /**
   * Delete a country
   * Prevents deletion if country has associated products
   * @param id - Country ID
   * @returns Success message
   * @throws NotFoundException if country not found
   * @throws BadRequestException if country has associated products
   */
  async deleteCountry(id: number): Promise<CountryDeleteResponse> {
    const country = await this.countryRepository.findById(id);
    if (!country) {
      throw new NotFoundException(`Country with ID ${id} not found`);
    }

    // Check if country has associated products
    const productCount = await this.prisma.product.count({
      where: { countryId: id },
    });

    if (productCount > 0) {
      throw new BadRequestException(
        `Cannot delete country. ${productCount} product(s) are associated with this country. Please reassign or delete those products first.`,
      );
    }

    await this.countryRepository.delete(id);

    return { message: 'Country deleted successfully' };
  }

  /**
   * Search countries by name or code
   * Performs case-insensitive search on both name and code fields
   * @param query - Search query string
   * @returns Array of matching countries
   */
  async searchCountries(query: string): Promise<CountryWithRelations[]> {
    if (!query || query.trim().length === 0) {
      return this.getAllCountries();
    }
    return this.countryRepository.search(query, ['name', 'code']);
  }

  /**
   * Get total count of countries
   * Returns the total number of active countries in the system
   * @returns Object containing count
   */
  async getCountriesCount(): Promise<CountryCountResponse> {
    const count = await this.countryRepository.count();
    return { count };
  }

  /**
   * Get total count of all countries including inactive (Admin only)
   * Returns the total number of all countries in the system
   * @returns Object containing count
   */
  async getAllCountriesCount(): Promise<CountryCountResponse> {
    const count = await this.countryRepository.countAll();
    return { count };
  }

  /**
   * Toggle country active status
   * Activates inactive countries or deactivates active ones
   * @param id - Country ID
   * @returns Updated country
   * @throws NotFoundException if country not found
   */
  async toggleCountryStatus(id: number): Promise<CountryWithRelations> {
    const country = await this.countryRepository.findById(id);
    if (!country) {
      throw new NotFoundException(`Country with ID ${id} not found`);
    }

    return this.countryRepository.update(id, {
      isActive: !country.isActive,
    });
  }

  /**
   * Get countries with filters
   * Returns paginated and filtered list of countries
   * @param filters - Filter options including isActive status
   * @returns Paginated result with countries
   */
  async getCountriesWithFilters(
    filters: CountryFilterDto,
  ): Promise<PaginatedResult<CountryWithRelations>> {
    const { search, isActive, sortBy = 'name', sortOrder = 'asc' } = filters;

    const queryOptions = {
      filters: isActive !== undefined ? { isActive } : {},
      search: search ? { query: search, fields: ['name', 'code'] } : undefined,
      sort: { field: sortBy, order: sortOrder },
      pagination: { page: 1, limit: 50 },
    };

    return this.countryRepository.findWithFilters(queryOptions);
  }
}
