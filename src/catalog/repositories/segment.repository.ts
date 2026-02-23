import { Injectable } from '@nestjs/common';
import { Segment } from '@/generated/prisma/client';
import { PrismaService } from '@/core/config/prisma/prisma.service';
import { BaseRepository } from '@/shared/repository/base.repository';
import {
  FilterOptions,
  PaginatedResult,
  QueryOptions,
} from '@/shared/types';

@Injectable()
export class SegmentRepository extends BaseRepository<Segment, number> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: number): Promise<Segment | null> {
    return this.prisma.segment.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            productSegments: true,
          },
        },
      },
    });
  }

  async findAll(): Promise<Segment[]> {
    return this.prisma.segment.findMany({
      orderBy: [{ position: 'asc' }, { key: 'asc' }],
    });
  }

  async create(data: Partial<Segment>): Promise<Segment> {
    return this.prisma.segment.create({
      data: data as any,
    });
  }

  async update(id: number, data: Partial<Segment>): Promise<Segment> {
    return this.prisma.segment.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.segment.delete({
      where: { id },
    });
  }

  async findWithFilters(
    options: QueryOptions,
  ): Promise<PaginatedResult<Segment>> {
    const {
      filters = {},
      sort,
      pagination = { page: 1, limit: 10 },
      search,
    } = options;

    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {
      ...filters,
    };

    if (search?.query) {
      where.OR = search.fields.map((field) => ({
        [field]: {
          contains: search.query,
          mode: 'insensitive',
        },
      }));
    }

    const [data, total] = await Promise.all([
      this.prisma.segment.findMany({
        where,
        skip,
        take: limit,
        orderBy: sort ? { [sort.field]: sort.order } : { position: 'asc' },
      }),
      this.prisma.segment.count({ where }),
    ]);

    return {
      data,
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

  async search(query: string, fields: string[]): Promise<Segment[]> {
    const where: any = {
      OR: fields.map((field) => ({
        [field]: {
          contains: query,
          mode: 'insensitive',
        },
      })),
    };

    return this.prisma.segment.findMany({
      where,
      orderBy: [{ position: 'asc' }, { key: 'asc' }],
    });
  }

  async countTotal(filters?: FilterOptions): Promise<number> {
    return this.prisma.segment.count({
      where: filters,
    });
  }

  async findByKey(key: string): Promise<Segment | null> {
    return this.prisma.segment.findUnique({
      where: { key },
    });
  }

  async findActive(): Promise<Segment[]> {
    return this.prisma.segment.findMany({
      where: { isActive: true },
      orderBy: [{ position: 'asc' }, { key: 'asc' }],
    });
  }
}
