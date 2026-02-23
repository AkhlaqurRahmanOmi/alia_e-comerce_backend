import { Injectable } from '@nestjs/common';
import { Country } from '@/generated/prisma/client';
import { PrismaService } from '../../core/config/prisma/prisma.service';
import { BaseRepository } from '../../shared/repository/base.repository';
import { CountryWithRelations } from '../types';
import {
  FilterOptions,
  PaginatedResult,
  QueryOptions,
} from '../../shared/types';

@Injectable()
export class CountryRepository extends BaseRepository<Country, number> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: number): Promise<CountryWithRelations | null> {
    return this.prisma.country.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findAll(): Promise<CountryWithRelations[]> {
    return this.prisma.country.findMany({
      // where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
  }

  async findAllWithInactive(): Promise<CountryWithRelations[]> {
    return this.prisma.country.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
  }

  async findByCode(code: string): Promise<CountryWithRelations | null> {
    return this.prisma.country.findUnique({
      where: { code },
    });
  }

  async findByName(name: string): Promise<CountryWithRelations | null> {
    return this.prisma.country.findUnique({
      where: { name },
    });
  }

  async create(data: Partial<Country>): Promise<CountryWithRelations> {
    return this.prisma.country.create({
      data: data as any,
    });
  }

  async update(id: number, data: Partial<Country>): Promise<CountryWithRelations> {
    return this.prisma.country.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.country.delete({
      where: { id },
    });
  }

  async count(): Promise<number> {
    return this.prisma.country.count({

    });
  }

  async countAll(): Promise<number> {
    return this.prisma.country.count();
  }

  async search(query: string, fields: string[]): Promise<CountryWithRelations[]> {
    return this.prisma.country.findMany({
      where: {
        // isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { code: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
    });
  }

  async findWithFilters(
    options: QueryOptions,
  ): Promise<PaginatedResult<CountryWithRelations>> {
    const {
      filters = {},
      sort,
      pagination = { page: 1, limit: 10 },
      search,
    } = options;

    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Build base where clause
    const where: any = {
      ...filters,
    };

    // Default to active countries only for public access
    if (!filters.hasOwnProperty('isActive')) {
      where.isActive = true;
    }

    // Add search functionality
    if (search?.query) {
      where.OR = [
        { name: { contains: search.query, mode: 'insensitive' } },
        { code: { contains: search.query, mode: 'insensitive' } },
      ];
    }

    const countriesQuery = this.prisma.country.findMany({
      where,
      skip,
      take: limit,
      orderBy: sort ? { [sort.field]: sort.order } : { name: 'asc' },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    const countQuery = this.prisma.country.count({ where });
    const [countries, total] = await Promise.all([countriesQuery, countQuery]);

    return {
      data: countries,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async countTotal(filters?: FilterOptions): Promise<number> {
    const where: any = { ...filters };
    
    // Default to active countries only for public access
    if (!filters?.hasOwnProperty('isActive')) {
      where.isActive = true;
    }
    
    return this.prisma.country.count({ where });
  }
}
