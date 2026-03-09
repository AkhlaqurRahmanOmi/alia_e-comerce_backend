import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Category } from '@/generated/prisma/client';
import { CategoryRepository } from '../repositories/category.repository';
import { CreateCategoryDto, UpdateCategoryDto } from '../dtos';

type CategoryNode = {
  id: number;
  name: string;
  slug: string;
  iconUrl: string | null;
  parentId: number | null;
};

type CategoryFilterResponse = {
  category: {
    id: number;
    name: string;
    slug: string;
    iconUrl: string | null;
  };
  priceRange: {
    min: number | null;
    max: number | null;
  };
  subcategories: Array<{
    id: number;
    name: string;
    slug: string;
    iconUrl: string | null;
    productCount: number;
  }>;
  sizes: Array<{
    value: string;
    productCount: number;
  }>;
};

@Injectable()
export class CategoryManagementProvider {
  constructor(
    private readonly categoryRepository: CategoryRepository,
  ) {}

  /**
   * Create a new category
   */
  async createCategory(
    createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    // Check if slug already exists
    const existingCategory = await this.categoryRepository.findBySlug(
      createCategoryDto.slug,
    );
    if (existingCategory) {
      throw new ConflictException(
        `Category with slug '${createCategoryDto.slug}' already exists`,
      );
    }

    // If parentId is provided, verify it exists
    if (createCategoryDto.parentId) {
      const parentCategory = await this.categoryRepository.findById(
        createCategoryDto.parentId,
      );
      if (!parentCategory) {
        throw new NotFoundException(
          `Parent category with ID ${createCategoryDto.parentId} not found`,
        );
      }
    }

    return this.categoryRepository.create(createCategoryDto);
  }

  /**
   * Update an existing category
   */
  async updateCategory(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Check slug uniqueness if being updated
    if (updateCategoryDto.slug && updateCategoryDto.slug !== category.slug) {
      const existingCategory = await this.categoryRepository.findBySlug(
        updateCategoryDto.slug,
      );
      if (existingCategory && existingCategory.id !== id) {
        throw new ConflictException(
          `Category with slug '${updateCategoryDto.slug}' already exists`,
        );
      }
    }

    // If parentId is being updated, verify it exists and prevent circular reference
    if (
      updateCategoryDto.parentId !== undefined &&
      updateCategoryDto.parentId !== category.parentId
    ) {
      if (updateCategoryDto.parentId === id) {
        throw new BadRequestException(
          'A category cannot be its own parent',
        );
      }

      if (updateCategoryDto.parentId) {
        const parentCategory = await this.categoryRepository.findById(
          updateCategoryDto.parentId,
        );
        if (!parentCategory) {
          throw new NotFoundException(
            `Parent category with ID ${updateCategoryDto.parentId} not found`,
          );
        }

        // Check for circular reference (prevent setting parent to a descendant)
        const isDescendant = await this.isDescendant(
          id,
          updateCategoryDto.parentId,
        );
        if (isDescendant) {
          throw new BadRequestException(
            'Cannot set parent to a descendant category (circular reference)',
          );
        }
      }
    }

    return this.categoryRepository.update(id, updateCategoryDto);
  }

  /**
   * Delete a category
   */
  async deleteCategory(id: number): Promise<void> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Check if category has children
    const children = await this.categoryRepository.findChildren(id);
    if (children.length > 0) {
      throw new BadRequestException(
        'Cannot delete category with child categories. Please delete or reassign child categories first.',
      );
    }

    // Check if category has products
    const productCount =
      await this.categoryRepository.countProductsInCategory(id);
    if (productCount > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${productCount} associated products. Please reassign products first.`,
      );
    }

    await this.categoryRepository.delete(id);
  }

  /**
   * Get a single category by ID
   */
  async getCategoryById(id: number): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  /**
   * Get a single category by slug
   */
  async getCategoryBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findBySlug(slug);
    if (!category) {
      throw new NotFoundException(`Category with slug '${slug}' not found`);
    }

    return category;
  }

  /**
   * Get all categories
   */
  async getAllCategories(): Promise<Category[]> {
    return this.categoryRepository.findAll()
  }

  /**
   * Get root categories (no parent)
   */
  async getRootCategories(): Promise<Category[]> {
    return this.categoryRepository.findRootCategories();
  }

  /**
   * Get child categories of a parent
   */
  async getChildCategories(parentId: number): Promise<Category[]> {
    // Verify parent exists
    const parent = await this.categoryRepository.findById(parentId);
    if (!parent) {
      throw new NotFoundException(`Category with ID ${parentId} not found`);
    }

    return this.categoryRepository.findChildren(parentId);
  }

  /**
   * Get category tree (hierarchical structure)
   */
  async getCategoryTree(): Promise<Category[]> {
    return this.categoryRepository.findCategoryTree()
  }

  async getCategoryFilters(categoryId: number): Promise<CategoryFilterResponse> {
    const categoryNodes = await this.categoryRepository.findAllCategoryNodes();

    const category = categoryNodes.find((node) => node.id === categoryId);
    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    const descendantsMap = this.buildDescendantsMap(categoryNodes);
    const categoryScopeIds = descendantsMap.get(categoryId) ?? [categoryId];
    const productAssignments =
      await this.categoryRepository.findActiveProductAssignmentsByCategoryIds(
        categoryScopeIds,
      );
    const scopedAssignments = productAssignments.filter((assignment) =>
      categoryScopeIds.includes(assignment.categoryId),
    );

    const productIds = Array.from(
      new Set(scopedAssignments.map((assignment) => assignment.productId)),
    );
    const variants =
      await this.categoryRepository.findActiveVariantFilterData(productIds);

    const subcategories = (categoryNodes.filter(
      (node) => node.parentId === categoryId,
    ) as CategoryNode[]).map((child) => {
      const childScopeIds = descendantsMap.get(child.id) ?? [child.id];
      const childProductIds = new Set(
        scopedAssignments
          .filter((assignment) => childScopeIds.includes(assignment.categoryId))
          .map((assignment) => assignment.productId),
      );

      return {
        id: child.id,
        name: child.name,
        slug: child.slug,
        iconUrl: child.iconUrl,
        productCount: childProductIds.size,
      };
    });

    const prices = variants.map((variant) => variant.price);
    const sizeProductMap = new Map<string, Set<number>>();

    for (const variant of variants) {
      for (const optionRow of variant.variantOptionValues) {
        const optionName = optionRow.productOption.name.trim().toLowerCase();
        if (optionName !== 'size' && optionName !== 'sizes') {
          continue;
        }

        const value = optionRow.optionValue.value.trim();
        if (!value) {
          continue;
        }

        const existing = sizeProductMap.get(value) ?? new Set<number>();
        existing.add(variant.productId);
        sizeProductMap.set(value, existing);
      }
    }

    const sizes = Array.from(sizeProductMap.entries())
      .map(([value, matchingProducts]) => ({
        value,
        productCount: matchingProducts.size,
      }))
      .sort((a, b) => a.value.localeCompare(b.value));

    return {
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        iconUrl: category.iconUrl,
      },
      priceRange: {
        min: prices.length > 0 ? Math.min(...prices) : null,
        max: prices.length > 0 ? Math.max(...prices) : null,
      },
      subcategories,
      sizes,
    };
  }

  /**
   * Get category path (breadcrumb)
   */
  async getCategoryPath(categoryId: number): Promise<Category[]> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    return this.categoryRepository.findCategoryPath(categoryId);
  }

  /**
   * Get products in a category
   */
  async getProductsByCategory(categoryId: number) {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    return (category as any).productCategories?.map((pc: any) => pc.product) || [];
  }

  /**
   * Count products in a category
   */
  async countProductsInCategory(categoryId: number): Promise<number> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    return this.categoryRepository.countProductsInCategory(categoryId);
  }

  /**
   * Helper method to check if a category is a descendant of another
   */
  private async isDescendant(
    ancestorId: number,
    categoryId: number,
  ): Promise<boolean> {
    const path = await this.categoryRepository.findCategoryPath(categoryId);
    return path.some((cat) => cat.id === ancestorId);
  }

  /**
   * helper method to count
   */
  private transformWithProductCount(category: any): any {
    return {
      ...category,
      productCount: category._count?.productCategories || 0,
      _count: undefined,
      children: category.children?.map((c: any) => this.transformWithProductCount(c)),
    };
  }

  private buildDescendantsMap(categories: CategoryNode[]): Map<number, number[]> {
    const childrenByParent = new Map<number | null, CategoryNode[]>();

    for (const category of categories) {
      const siblings = childrenByParent.get(category.parentId) ?? [];
      siblings.push(category);
      childrenByParent.set(category.parentId, siblings);
    }

    const descendantsMap = new Map<number, number[]>();

    const collect = (categoryId: number): number[] => {
      if (descendantsMap.has(categoryId)) {
        return descendantsMap.get(categoryId)!;
      }

      const descendants = [categoryId];
      const children = childrenByParent.get(categoryId) ?? [];

      for (const child of children) {
        descendants.push(...collect(child.id));
      }

      descendantsMap.set(categoryId, descendants);
      return descendants;
    };

    for (const category of categories) {
      collect(category.id);
    }

    return descendantsMap;
  }

}
