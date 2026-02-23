import { Injectable } from '@nestjs/common';
import { Permission } from '@/generated/prisma/client';
import { PrismaService } from '../../core/config/prisma/prisma.service';
import { BaseRepository } from '../../shared/repository/base.repository';
import { PermissionWithRelations } from '../types';
import {
  FilterOptions,
  PaginatedResult,
  QueryOptions,
} from '../../shared/types';

@Injectable()
export class PermissionRepository extends BaseRepository<Permission, number> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: number): Promise<PermissionWithRelations | null> {
    return this.prisma.permission.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            role: true,
          },
        },
        _count: {
          select: {
            rolePermissions: true,
          },
        },
      },
    });
  }

  async findAll(): Promise<PermissionWithRelations[]> {
    return this.prisma.permission.findMany({
      orderBy: { name: 'asc' },
      include: {
        rolePermissions: {
          include: {
            role: true,
          },
        },
        _count: {
          select: {
            rolePermissions: true,
          },
        },
      },
    });
  }

  async findByName(name: string): Promise<PermissionWithRelations | null> {
    return this.prisma.permission.findUnique({
      where: { name },
      include: {
        rolePermissions: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async create(data: Partial<Permission>): Promise<PermissionWithRelations> {
    return this.prisma.permission.create({
      data: data as any,
      include: {
        rolePermissions: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async update(
    id: number,
    data: Partial<Permission>,
  ): Promise<PermissionWithRelations> {
    return this.prisma.permission.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
      include: {
        rolePermissions: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.permission.delete({
      where: { id },
    });
  }

  async search(
    query: string,
    fields: string[],
  ): Promise<PermissionWithRelations[]> {
    return this.prisma.permission.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
      include: {
        rolePermissions: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findWithFilters(
    options: QueryOptions,
  ): Promise<PaginatedResult<PermissionWithRelations>> {
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
      where.OR = [
        { name: { contains: search.query, mode: 'insensitive' } },
        { description: { contains: search.query, mode: 'insensitive' } },
      ];
    }

    const permissionsQuery = this.prisma.permission.findMany({
      where,
      skip,
      take: limit,
      orderBy: sort ? { [sort.field]: sort.order } : { name: 'asc' },
      include: {
        rolePermissions: {
          include: {
            role: true,
          },
        },
        _count: {
          select: {
            rolePermissions: true,
          },
        },
      },
    });

    const countQuery = this.prisma.permission.count({ where });
    const [permissions, total] = await Promise.all([
      permissionsQuery,
      countQuery,
    ]);

    return {
      data: permissions,
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
    return this.prisma.permission.count({
      where: {
        ...filters,
      },
    });
  }
}
