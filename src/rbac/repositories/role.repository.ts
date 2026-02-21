import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../core/config/prisma/prisma.service';
import { BaseRepository } from '../../shared/repository/base.repository';
import { RoleWithRelations } from '../types';
import {
  FilterOptions,
  PaginatedResult,
  QueryOptions,
} from '../../shared/types';

@Injectable()
export class RoleRepository extends BaseRepository<Role, number> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: number): Promise<RoleWithRelations | null> {
    return this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
            rolePermissions: true,
          },
        },
      },
    });
  }

  async findAll(): Promise<RoleWithRelations[]> {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
            rolePermissions: true,
          },
        },
      },
    });
  }

  async findByName(name: string): Promise<RoleWithRelations | null> {
    return this.prisma.role.findUnique({
      where: { name },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async create(data: Partial<Role>): Promise<RoleWithRelations> {
    return this.prisma.role.create({
      data: data as any,
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async update(id: number, data: Partial<Role>): Promise<RoleWithRelations> {
    return this.prisma.role.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.role.delete({
      where: { id },
    });
  }

  async assignPermissions(
    roleId: number,
    permissionIds: number[],
  ): Promise<void> {
    await this.prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({
        roleId,
        permissionId,
      })),
      skipDuplicates: true,
    });
  }

  async removePermissions(
    roleId: number,
    permissionIds: number[],
  ): Promise<void> {
    await this.prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId: {
          in: permissionIds,
        },
      },
    });
  }

  async search(query: string, fields: string[]): Promise<RoleWithRelations[]> {
    return this.prisma.role.findMany({
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
            permission: true,
          },
        },
      },
    });
  }

  async findWithFilters(
    options: QueryOptions,
  ): Promise<PaginatedResult<RoleWithRelations>> {
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

    const rolesQuery = this.prisma.role.findMany({
      where,
      skip,
      take: limit,
      orderBy: sort ? { [sort.field]: sort.order } : { name: 'asc' },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
            rolePermissions: true,
          },
        },
      },
    });

    const countQuery = this.prisma.role.count({ where });
    const [roles, total] = await Promise.all([rolesQuery, countQuery]);

    return {
      data: roles,
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
    return this.prisma.role.count({
      where: {
        ...filters,
      },
    });
  }
}
