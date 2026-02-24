import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Product } from '@/generated/prisma/client';
import { ProductRepository } from '../repositories';
import { CreateProductDto, UpdateProductDto, ProductFilterDto } from '../dtos';
import { PaginatedResult, QueryOptions } from '../../shared/types';
import { PrismaService } from '../../core/config/prisma/prisma.service';

@Injectable()
export class ProductManagementProvider {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Create a new product
   */
  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    const { segmentIds, attributes, ...productData } = createProductDto;

    // Check if slug already exists
    if (productData.seoSlug) {
      const existingProduct = await this.productRepository.findBySlug(
        productData.seoSlug,
      );
      if (existingProduct) {
        throw new ConflictException(
          `Product with slug '${productData.seoSlug}' already exists`,
        );
      }
    }

    const normalizedSegmentIds = await this.validateSegmentIds(segmentIds);
    const createdProduct = await this.productRepository.create(productData);

    if (attributes && attributes.length > 0) {
      await this.prisma.productAttribute.createMany({
        data: attributes.map((attribute) => ({
          productId: createdProduct.id,
          name: attribute.name,
          value: attribute.value,
        })),
        skipDuplicates: true,
      });
    }

    if (
      (normalizedSegmentIds && normalizedSegmentIds.length > 0) ||
      (attributes && attributes.length > 0)
    ) {
      if (normalizedSegmentIds && normalizedSegmentIds.length > 0) {
        await this.productRepository.setProductSegments(
          createdProduct.id,
          normalizedSegmentIds,
        );
      }

      const hydratedProduct = await this.productRepository.findById(createdProduct.id);
      if (!hydratedProduct) {
        throw new NotFoundException(`Product with ID ${createdProduct.id} not found`);
      }
      return hydratedProduct;
    }

    return createdProduct;
  }

  /**
   * Update an existing product
   */
  async updateProduct(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Check slug uniqueness if being updated
    if (updateProductDto.seoSlug && updateProductDto.seoSlug !== product.seoSlug) {
      const existingProduct = await this.productRepository.findBySlug(
        updateProductDto.seoSlug,
      );
      if (existingProduct && existingProduct.id !== id) {
        throw new ConflictException(
          `Product with slug '${updateProductDto.seoSlug}' already exists`,
        );
      }
    }

    // Check if this is a complete update (with nested data)
    const { options, variants, images, categoryIds, segmentIds, attributes, ...productData } =
      updateProductDto;
    const normalizedSegmentIds = await this.validateSegmentIds(segmentIds);

    if (
      !options &&
      !variants &&
      !images &&
      !categoryIds &&
      normalizedSegmentIds === undefined &&
      attributes === undefined
    ) {
      // Simple update - just product fields
      return this.productRepository.update(id, productData);
    }

    // Complete update with nested data - use repository method
    return this.productRepository.updateComplete(id, {
      productData,
      options,
      variants,
      images,
      categoryIds,
      segmentIds: normalizedSegmentIds,
      attributes,
    });
  }

  private async validateSegmentIds(
    segmentIds?: number[],
  ): Promise<number[] | undefined> {
    if (segmentIds === undefined) {
      return undefined;
    }

    const uniqueSegmentIds = [...new Set(segmentIds)];
    if (uniqueSegmentIds.length === 0) {
      return [];
    }

    const existingSegments = await this.prisma.segment.findMany({
      where: { id: { in: uniqueSegmentIds } },
      select: { id: true },
    });

    const existingIds = new Set(existingSegments.map((segment) => segment.id));
    const missingSegmentIds = uniqueSegmentIds.filter((id) => !existingIds.has(id));

    if (missingSegmentIds.length > 0) {
      throw new NotFoundException(
        `Segment(s) not found: ${missingSegmentIds.join(', ')}`,
      );
    }

    return uniqueSegmentIds;
  }

  /**
   * Soft delete a product
   */
  async deleteProduct(id: number): Promise<void> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    await this.productRepository.delete(id);
  }

  /**
   * Get a single product by ID
   */
  async getProductById(id: number): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product || product.deletedAt) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  /**
   * Get a single product by slug
   */
  async getProductBySlug(slug: string): Promise<Product> {
    const product = await this.productRepository.findBySlug(slug);
    if (!product || product.deletedAt) {
      throw new NotFoundException(`Product with slug '${slug}' not found`);
    }

    return product;
  }

  /**
   * Get all products with filtering, sorting, and pagination
   */
  // In src/catalog/providers/product-management.provider.ts
// Update the getAllProducts method to pass minRating filter

  private async getDescendantCategoryIds(rootCategoryId: number): Promise<number[]> {
    const seen = new Set<number>([rootCategoryId]);
    let frontier: number[] = [rootCategoryId];

    while (frontier.length > 0) {
      const children = await this.prisma.category.findMany({
        where: {
          parentId: {
            in: frontier,
          },
        },
        select: {
          id: true,
        },
      });

      const nextFrontier = children
        .map((child) => child.id)
        .filter((id) => !seen.has(id));

      if (nextFrontier.length === 0) {
        break;
      }

      nextFrontier.forEach((id) => seen.add(id));
      frontier = nextFrontier;
    }

    return Array.from(seen);
  }

  async getAllProducts(filterDto: ProductFilterDto) {
    // Validate price range
    if (filterDto.minPrice && filterDto.maxPrice && filterDto.minPrice > filterDto.maxPrice) {
      throw new ConflictException('minPrice cannot be greater than maxPrice');
    }

    const categoryIds = filterDto.categoryId
      ? await this.getDescendantCategoryIds(filterDto.categoryId)
      : [];

    const categoryFilter = categoryIds.length
      ? { productCategories: { some: { categoryId: { in: categoryIds } } } }
      : {};

    const options: QueryOptions = {
      filters: {
        isActive: filterDto.isActive,
        minPrice: filterDto.minPrice,
        maxPrice: filterDto.maxPrice,
        minRating: filterDto.minRating, // ✅ FIXED: was using maxRating
        countryId: filterDto.countryId,
        ...categoryFilter,
      },
      pagination: {
        page: filterDto.page || 1,
        limit: filterDto.limit || 10,
      },
      sort: filterDto.sortBy ? {
        field: filterDto.sortBy,
        order: filterDto.sortOrder || 'asc',
      } : undefined,
      search: filterDto.search ? {
        query: filterDto.search,
        fields: ['name', 'description'],
      } : undefined,
    };

    return this.productRepository.findWithFilters(options);
  }




  /**
   * Get all active products
   */
  async getActiveProducts(): Promise<Product[]> {
    return this.productRepository.findActiveProducts();
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return this.productRepository.findWithCategories(categoryId);
  }

  /**
   * Publish a product (set isActive to true)
   */
  async publishProduct(id: number): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.productRepository.update(id, { isActive: true });
  }

  /**
   * Unpublish a product (set isActive to false)
   */
  async unpublishProduct(id: number): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.productRepository.update(id, { isActive: false });
  }

  /**
   * Add product to category
   */
  async addProductToCategory(
    productId: number,
    categoryId: number,
  ): Promise<void> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Check if category exists
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    // Check if already associated
    const existingAssociation = await this.prisma.productCategory.findUnique({
      where: {
        productId_categoryId: {
          productId,
          categoryId,
        },
      },
    });

    if (existingAssociation) {
      throw new ConflictException(
        `Product is already associated with this category`,
      );
    }

    await this.prisma.productCategory.create({
      data: {
        productId,
        categoryId,
      },
    });
  }

  /**
   * Remove product from category
   */
  async removeProductFromCategory(
    productId: number,
    categoryId: number,
  ): Promise<void> {
    const association = await this.prisma.productCategory.findUnique({
      where: {
        productId_categoryId: {
          productId,
          categoryId,
        },
      },
    });

    if (!association) {
      throw new NotFoundException(
        `Product is not associated with this category`,
      );
    }

    await this.prisma.productCategory.delete({
      where: {
        productId_categoryId: {
          productId,
          categoryId,
        },
      },
    });
  }

  /**
   * Search products
   */
  // async searchProducts(query: string): Promise<Product[]> {
  //   return this.productRepository.search(query, [
  //     'name',
  //     'description',
  //     'seoKeywords',
  //   ]);
  // }

    /**
     * Search products another endpoint
     */
    async searchProducts(query: string, filters: ProductFilterDto) {
        return this.productRepository.searchProducts(query, filters);
    }

}
