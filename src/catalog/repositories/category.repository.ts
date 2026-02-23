import { Injectable } from '@nestjs/common';
import { Category } from '@/generated/prisma/client';
import { PrismaService } from '@/core/config/prisma/prisma.service';
import { BaseRepository } from '@/shared/repository/base.repository';
import {
  FilterOptions,
  PaginatedResult,
  QueryOptions,
} from '@/shared/types';

@Injectable()
export class CategoryRepository extends BaseRepository<Category, number> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }


  //count of all products by categories
  private readonly productCountInclude = {
    _count: {
      select: {
        productCategories: {
          where: {
            product: {
              deletedAt: null,
              isActive: true,
            },
          },
        },
      },
    },
  };
  async findById(id: number): Promise<Category | null> {
    return this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        productCategories: {
          include: {
            product: {
              include: {
                productImages: {
                  where: { isMain: true },
                  take: 1,
                },
                variants: {
                  take: 1,
                  orderBy: { price: 'asc' },
                },
              },
            },
          },
        },
      },
    });
  }

  async findAll(): Promise<any[]> {
    const categories = await this.prisma.category.findMany({
      include: {
        parent: true,
        children: true,
        _count: {
          select: { productCategories: true },
        },
      },
    });

    // Manually count active products for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => ({
        ...cat,
        productCount: await this.countProductsInCategory(cat.id),
      })),
    );

    return categoriesWithCount;
  }

  async create(data: Partial<Category>): Promise<Category> {
    return this.prisma.category.create({
      data: data as any,
      include: {
        parent: true,
        children: true,
      },
    });
  }

  async update(id: number, data: Partial<Category>): Promise<Category> {
    return this.prisma.category.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
      include: {
        parent: true,
        children: true,
      },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.category.delete({
      where: { id },
    });
  }

  async findWithFilters(
    options: QueryOptions,
  ): Promise<PaginatedResult<Category>> {
    const {
      filters = {},
      sort,
      pagination = { page: 1, limit: 10 },
      search,
    } = options;

    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      ...filters,
    };

    // Add search functionality
    if (search?.query) {
      where.OR = search.fields.map((field) => ({
        [field]: {
          contains: search.query,
          mode: 'insensitive',
        },
      }));
    }

    // Execute query with pagination
    const [data, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: sort ? { [sort.field]: sort.order } : { createdAt: 'desc' },
        include: {
          parent: true,
          children: true,
        },
      }),
      this.prisma.category.count({ where }),
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

  async search(query: string, fields: string[]): Promise<Category[]> {
    const where: any = {
      OR: fields.map((field) => ({
        [field]: {
          contains: query,
          mode: 'insensitive',
        },
      })),
    };

    return this.prisma.category.findMany({
      where,
      include: {
        parent: true,
        children: true,
      },
    });
  }

  async countTotal(filters?: FilterOptions): Promise<number> {
    return this.prisma.category.count({
      where: filters,
    });
  }

  // Category-specific methods
  async findBySlug(slug: string): Promise<Category | null> {
    return this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: true,
        productCategories: {
          include: {
            product: {
              include: {
                productImages: {
                  where: { isMain: true },
                  take: 1,
                },
                variants: {
                  where: { isActive: true },
                  take: 1,
                  orderBy: { price: 'asc' },
                },
              },
            },
          },
        },
      },
    });
  }

  async findRootCategories(): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: {
        parentId: null,
      },
      include: {
        children: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findChildren(parentId: number): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: {
        parentId,
      },
      include: {
        children: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findCategoryTree(): Promise<any[]> {
    const categories = await this.prisma.category.findMany({
      include: {
        parent: true,
        children: {
          include: {
            children: {
              include: { children: true },
            },
          },
        },
      },
    });

    // Get all descendant IDs for each category in a single efficient operation
    const categoryDescendantsMap = this.buildDescendantsMap(categories);

    // Batch fetch all product counts in a single query
    const productCountsMap = await this.batchCountProducts(categoryDescendantsMap);

    // Build tree with counts
    const addCounts = (cat: any): any => ({
      ...cat,
      productCount: productCountsMap.get(cat.id) || 0,
      children: cat.children ? cat.children.map(addCounts) : [],
    });

    const roots = categories.filter((c) => !c.parentId);
    return roots.map(addCounts);
  }

  /**
   * Build a map of category ID to all its descendant IDs (including itself)
   */
  private buildDescendantsMap(categories: any[]): Map<number, number[]> {
    const categoryMap = new Map<number, any>();
    categories.forEach(cat => categoryMap.set(cat.id, cat));

    const descendantsMap = new Map<number, number[]>();

    const getDescendants = (categoryId: number): number[] => {
      if (descendantsMap.has(categoryId)) {
        return descendantsMap.get(categoryId)!;
      }

      const category = categoryMap.get(categoryId);
      if (!category) return [];

      const descendants = [categoryId];

      if (category.children && category.children.length > 0) {
        category.children.forEach((child: any) => {
          descendants.push(...getDescendants(child.id));
        });
      }

      descendantsMap.set(categoryId, descendants);
      return descendants;
    };

    // Build descendants for all categories
    categories.forEach(cat => getDescendants(cat.id));

    return descendantsMap;
  }

  /**
   * Batch count products for all categories in a single query
   */
  private async batchCountProducts(categoryDescendantsMap: Map<number, number[]>): Promise<Map<number, number>> {
    const countsMap = new Map<number, number>();

    // Get all product-category relationships for active products in one query
    const productCategories = await this.prisma.productCategory.findMany({
      where: {
        product: {
          deletedAt: null,
          isActive: true,
        },
      },
      select: {
        categoryId: true,
      },
    });

    // Count products for each category including descendants
    for (const [categoryId, descendantIds] of categoryDescendantsMap.entries()) {
      const count = productCategories.filter(pc =>
        descendantIds.includes(pc.categoryId)
      ).length;
      countsMap.set(categoryId, count);
    }

    return countsMap;
  }

  async findCategoryPath(categoryId: number): Promise<Category[]> {
    const path: Category[] = [];
    let currentCategory = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: { parent: true },
    });

    while (currentCategory) {
      path.unshift(currentCategory);
      if (currentCategory.parent) {
        currentCategory = await this.prisma.category.findUnique({
          where: { id: currentCategory.parentId! },
          include: { parent: true },
        });
      } else {
        currentCategory = null;
      }
    }

    return path;
  }

  async countProductsInCategory(categoryId: number): Promise<number> {
    return this.prisma.productCategory.count({
      where: {
        categoryId,
        product: {
          deletedAt: null,
          isActive: true,
        },
      },
    });
  }
}
