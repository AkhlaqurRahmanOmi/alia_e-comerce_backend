import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ProductManagementProvider,
  VariantManagementProvider,
  VariantGenerationProvider,
  CategoryManagementProvider,
  ImageManagementProvider,
  OptionManagementProvider,
  WishlistManagementProvider,
  SegmentManagementProvider,
} from './providers';
import {
  CreateProductDto,
  UpdateProductDto,
  CreateVariantDto,
  UpdateVariantDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateProductImageDto,
  CreateVariantImageDto,
  CreateProductOptionDto,
  CreateOptionValueDto,
  ProductFilterDto,
  CreateCompleteProductDto,
  AddToWishlistDto,
  CreateSegmentDto,
  UploadProductImageDto,
  UploadVariantImageDto,
  UpdateSegmentDto,
} from './dtos';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { MonitorClass } from '../shared/decorators/performance-monitor.decorator';
import { UnitOfWorkService } from '../shared/services/unit-of-work.service';
import { LocalFileStorageService } from '../shared/services/local-file-storage.service';
import { OptionDisplayType, Prisma } from '@/generated/prisma/client';

/**
 * CatalogService is a facade that exposes a simplified API
 * while coordinating multiple underlying providers.
 */

@MonitorClass(500)
@Injectable()
export class CatalogService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly productManagement: ProductManagementProvider,
    private readonly variantManagement: VariantManagementProvider,
    private readonly variantGeneration: VariantGenerationProvider,
    private readonly categoryManagement: CategoryManagementProvider,
    private readonly segmentManagement: SegmentManagementProvider,
    private readonly imageManagement: ImageManagementProvider,
    private readonly optionManagement: OptionManagementProvider,
    private readonly wishlistManagement: WishlistManagementProvider,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly localFileStorageService: LocalFileStorageService,
  ) {}

  // ---------- Read APIs (pass-through) ----------

  getProducts(filter: ProductFilterDto) {
    return this.productManagement.getAllProducts(filter);
  }

  getProductById(id: number) {
    return this.productManagement.getProductById(id);
  }

  getProductVariants(productId: number) {
    return this.variantManagement.getVariantsByProductId(productId);
  }

  getVariantById(id: number) {
    return this.variantManagement.getVariantById(id);
  }

  getVariantInventory(variantId: number) {
    return this.variantManagement.getVariantInventory(variantId);
  }

  getCategories() {
    return this.categoryManagement.getCategoryTree();
  }

  getCategoryById(id: number) {
    return this.categoryManagement.getCategoryById(id);
  }

  getCategoryFilters(categoryId: number) {
    return this.categoryManagement.getCategoryFilters(categoryId);
  }

  getCategoryProducts(categoryId: number) {
    return this.productManagement.getProductsByCategory(categoryId);
  }

  getSegments() {
    return this.segmentManagement.getAllSegments();
  }

  getActiveSegments() {
    return this.segmentManagement.getActiveSegments();
  }

  getSegmentById(id: number) {
    return this.segmentManagement.getSegmentById(id);
  }

  searchSegments(query: string) {
    return this.segmentManagement.searchSegments(query);
  }

  getProductImages(productId: number) {
    return this.imageManagement.getProductImages(productId);
  }

  getProductOptions(productId: number) {
    return this.optionManagement.getProductOptions(productId);
  }

  searchProducts(q: string, filters: ProductFilterDto) {
    return this.productManagement.searchProducts(q, filters);
  }

  // ---------- Write APIs (pass-through) ----------

  createProduct(dto: CreateProductDto) {
    return this.productManagement.createProduct(dto);
  }

  updateProduct(id: number, dto: UpdateProductDto) {
    return this.productManagement.updateProduct(id, dto);
  }

  async deleteProduct(id: number) {
    // Optional guard
    const existing = await this.productManagement.getProductById(id);
    if (!existing) throw new NotFoundException(`Product ${id} not found`);
    return this.productManagement.deleteProduct(id);
  }

  publishProduct(id: number) {
    return this.productManagement.publishProduct(id);
  }

  unpublishProduct(id: number) {
    return this.productManagement.unpublishProduct(id);
  }

  createVariant(dto: CreateVariantDto) {
    return this.variantManagement.createVariant(dto);
  }

  updateVariant(id: number, dto: UpdateVariantDto) {
    return this.variantManagement.updateVariant(id, dto);
  }

  async deleteVariant(id: number) {
    const existing = await this.variantManagement.getVariantById(id);
    if (!existing) throw new NotFoundException(`Variant ${id} not found`);
    return this.variantManagement.deleteVariant(id);
  }

  createCategory(dto: CreateCategoryDto) {
    return this.categoryManagement.createCategory(dto);
  }

  updateCategory(id: number, dto: UpdateCategoryDto) {
    return this.categoryManagement.updateCategory(id, dto);
  }

  async uploadCategoryIcon(categoryId: number, file: Express.Multer.File) {
    const category = await this.categoryManagement.getCategoryById(categoryId);

    const uploadResult = await this.localFileStorageService.uploadFile(
      file,
      'categories',
    );

    try {
      const updatedCategory = await this.categoryManagement.updateCategory(
        categoryId,
        {
          iconUrl: uploadResult.fileUrl,
        },
      );

      if (
        category.iconUrl &&
        category.iconUrl !== uploadResult.fileUrl &&
        category.iconUrl.includes('/uploads/categories/')
      ) {
        await this.localFileStorageService.deleteFile(category.iconUrl);
      }

      return updatedCategory;
    } catch (error) {
      await this.localFileStorageService.deleteFile(uploadResult.fileUrl);
      throw error;
    }
  }

  async deleteCategory(id: number) {
    const existing = await this.categoryManagement.getCategoryById(id);
    if (!existing) throw new NotFoundException(`Category ${id} not found`);
    return this.categoryManagement.deleteCategory(id);
  }

  createSegment(dto: CreateSegmentDto) {
    return this.segmentManagement.createSegment(dto);
  }

  updateSegment(id: number, dto: UpdateSegmentDto) {
    return this.segmentManagement.updateSegment(id, dto);
  }

  async deleteSegment(id: number) {
    const existing = await this.segmentManagement.getSegmentById(id);
    if (!existing) throw new NotFoundException(`Segment ${id} not found`);
    return this.segmentManagement.deleteSegment(id);
  }

  addProductImage(dto: CreateProductImageDto) {
    return this.imageManagement.addProductImage(dto);
  }

  async uploadProductImage(
    productId: number,
    file: Express.Multer.File,
    uploadDto: UploadProductImageDto,
  ) {
    const uploadResult = await this.localFileStorageService.uploadFile(
      file,
      'products',
    );

    try {
      return await this.imageManagement.addProductImage({
        productId,
        imageUrl: uploadResult.fileUrl,
        altText: uploadDto.altText,
        position: uploadDto.position,
        isMain: uploadDto.isMain,
      });
    } catch (error) {
      await this.localFileStorageService.deleteFile(uploadResult.fileUrl);
      throw error;
    }
  }

  deleteProductImage(imageId: number) {
    return this.imageManagement.deleteProductImage(imageId);
  }

  addVariantImage(dto: CreateVariantImageDto) {
    return this.imageManagement.addVariantImage(dto);
  }

  getVariantImages(variantId: number) {
    return this.imageManagement.getVariantImages(variantId);
  }

  async uploadVariantImage(
    variantId: number,
    file: Express.Multer.File,
    uploadDto: UploadVariantImageDto,
  ) {
    const uploadResult = await this.localFileStorageService.uploadFile(
      file,
      'variants',
    );

    try {
      return await this.imageManagement.addVariantImage({
        variantId,
        imageUrl: uploadResult.fileUrl,
        altText: uploadDto.altText,
        position: uploadDto.position,
      });
    } catch (error) {
      await this.localFileStorageService.deleteFile(uploadResult.fileUrl);
      throw error;
    }
  }

  deleteVariantImage(imageId: number) {
    return this.imageManagement.deleteVariantImage(imageId);
  }

  createProductOption(dto: CreateProductOptionDto) {
    return this.optionManagement.createProductOption(dto);
  }

  deleteProductOption(optionId: number) {
    return this.optionManagement.deleteProductOption(optionId);
  }

  createOptionValue(dto: CreateOptionValueDto) {
    return this.optionManagement.createOptionValue(dto);
  }

  deleteOptionValue(valueId: number) {
    return this.optionManagement.deleteOptionValue(valueId);
  }

  // ---------- Orchestrated flows ----------

  private normalizeOptionLookupKey(value: string): string {
    return value.trim().toLowerCase();
  }

  /**
   * SKUs are unique across the whole table, so a clash inside one payload would
   * only surface as an opaque Prisma constraint error part-way through the
   * transaction. Catch it up front — this also covers a generated SKU colliding
   * with one written out by hand.
   */
  private assertVariantSkusAreUnique(variants?: Array<{ sku: string }>): void {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const variant of variants ?? []) {
      const sku = variant.sku?.trim();
      if (!sku) continue;

      if (seen.has(sku)) {
        duplicates.add(sku);
      }
      seen.add(sku);
    }

    if (duplicates.size > 0) {
      throw new BadRequestException(
        `Duplicate SKU(s) in this product: ${[...duplicates].join(', ')}.`,
      );
    }
  }

  private async validateCategoryIdsInTransaction(
    tx: Prisma.TransactionClient,
    categoryIds?: number[],
  ): Promise<number[] | undefined> {
    if (categoryIds === undefined) {
      return undefined;
    }

    const uniqueCategoryIds = [...new Set(categoryIds)];
    if (uniqueCategoryIds.length === 0) {
      return [];
    }

    const existingCategories = await tx.category.findMany({
      where: { id: { in: uniqueCategoryIds } },
      select: { id: true },
    });

    const existingIds = new Set(existingCategories.map((category) => category.id));
    const missingCategoryIds = uniqueCategoryIds.filter(
      (categoryId) => !existingIds.has(categoryId),
    );

    if (missingCategoryIds.length > 0) {
      throw new NotFoundException(
        `Category(s) not found: ${missingCategoryIds.join(', ')}`,
      );
    }

    return uniqueCategoryIds;
  }

  private resolveVariantOptionLinks(
    variant: {
      sku: string;
      optionSelections?: Array<{ optionName: string; optionValue: string }>;
    },
    optionLookup: Map<
      string,
      { id: number; valuesByKey: Map<string, { id: number; value: string }> }
    >,
  ): Array<{ optionId: number; optionValueId: number }> {
    if (!variant.optionSelections || variant.optionSelections.length === 0) {
      return [];
    }

    const resolvedLinks = new Map<string, { optionId: number; optionValueId: number }>();

    for (const selection of variant.optionSelections) {
      const optionKey = this.normalizeOptionLookupKey(selection.optionName);
      const optionRecord = optionLookup.get(optionKey);

      if (!optionRecord) {
        throw new BadRequestException(
          `Variant '${variant.sku}' references unknown option '${selection.optionName}'.`,
        );
      }

      const valueKey = this.normalizeOptionLookupKey(selection.optionValue);
      const valueRecord = optionRecord.valuesByKey.get(valueKey);

      if (!valueRecord) {
        throw new BadRequestException(
          `Variant '${variant.sku}' references unknown value '${selection.optionValue}' for option '${selection.optionName}'.`,
        );
      }

      resolvedLinks.set(`${optionRecord.id}:${valueRecord.id}`, {
        optionId: optionRecord.id,
        optionValueId: valueRecord.id,
      });
    }

    return Array.from(resolvedLinks.values());
  }

  /**
   * Create a product with options, variants, images, and categories atomically.
   * Uses Unit of Work pattern to ensure all operations succeed or rollback.
   */
  async createCompleteProduct(data: CreateCompleteProductDto) {
    // Expand the option grid before opening the transaction: it is pure
    // computation, and a bad pattern should fail without holding a connection.
    const variants = data.generateVariants
      ? [
          ...(data.variants ?? []),
          ...this.variantGeneration.generate(data.options, data.generateVariants),
        ]
      : data.variants;

    this.assertVariantSkusAreUnique(variants);
    data = { ...data, variants };

    const productId = await this.unitOfWork.transaction(async (tx) => {
      const { segmentIds, attributes, ...productData } = data.product;
      const normalizedSegmentIds = [...new Set(segmentIds ?? [])];
      const normalizedCategoryIds = await this.validateCategoryIdsInTransaction(
        tx,
        data.categoryIds,
      );

      if (normalizedSegmentIds.length > 0) {
        const existingSegments = await tx.segment.findMany({
          where: { id: { in: normalizedSegmentIds } },
          select: { id: true },
        });

        const existingSegmentIds = new Set(existingSegments.map((segment) => segment.id));
        const missingSegmentIds = normalizedSegmentIds.filter(
          (segmentId) => !existingSegmentIds.has(segmentId),
        );

        if (missingSegmentIds.length > 0) {
          throw new NotFoundException(
            `Segment(s) not found: ${missingSegmentIds.join(', ')}`,
          );
        }
      }

      const product = await tx.product.create({
        data: {
          ...productData,
          isActive: productData.isActive ?? false,
        },
      });

      const operations: Promise<unknown>[] = [];

      if (normalizedCategoryIds && normalizedCategoryIds.length > 0) {
        operations.push(
          tx.productCategory.createMany({
            data: normalizedCategoryIds.map((categoryId) => ({
              productId: product.id,
              categoryId,
            })),
            skipDuplicates: true,
          }),
        );
      }

      if (normalizedSegmentIds.length > 0) {
        operations.push(
          tx.productSegment.createMany({
            data: normalizedSegmentIds.map((segmentId) => ({
              productId: product.id,
              segmentId,
            })),
            skipDuplicates: true,
          }),
        );
      }

      if (attributes?.length) {
        operations.push(
          tx.productAttribute.createMany({
            data: attributes.map((attribute) => ({
              productId: product.id,
              name: attribute.name,
              value: attribute.value,
            })),
            skipDuplicates: true,
          }),
        );
      }

      const createdOptionsByKey = new Map<
        string,
        { id: number; valuesByKey: Map<string, { id: number; value: string }> }
      >();

      if (data.options?.length) {
        for (const option of data.options) {
          const createdOption = await tx.productOption.create({
            data: {
              productId: product.id,
              name: option.name,
              position: option.position ?? 1,
              displayType: option.displayType ?? OptionDisplayType.text,
            },
          });

          const valuesByKey = new Map<string, { id: number; value: string }>();

          if (option.values?.length) {
            for (let index = 0; index < option.values.length; index += 1) {
              const value = option.values[index];
              const createdValue = await tx.optionValue.create({
                data: {
                  optionId: createdOption.id,
                  value: value.value,
                  code: value.code,
                  position: value.position ?? index + 1,
                  meta: value.meta as unknown as Prisma.InputJsonValue | undefined,
                },
              });

              valuesByKey.set(this.normalizeOptionLookupKey(value.value), {
                id: createdValue.id,
                value: createdValue.value,
              });
            }
          }

          createdOptionsByKey.set(this.normalizeOptionLookupKey(option.name), {
            id: createdOption.id,
            valuesByKey,
          });
        }
      }

      if (data.images?.length) {
        operations.push(
          tx.productImage.createMany({
            data: data.images.map((image, index) => ({
              productId: product.id,
              imageUrl: image.imageUrl,
              altText: image.altText,
              position: image.position ?? index,
              isMain: image.isMain ?? index === 0,
            })),
          }),
        );
      }

      if (operations.length > 0) {
        await Promise.all(operations);
      }

      if (data.variants?.length) {
        const defaultLocation = await tx.location.findFirst({
          orderBy: { id: 'asc' },
          select: { id: true },
        });

        for (const variant of data.variants) {
          const createdVariant = await tx.variant.create({
            data: {
              productId: product.id,
              sku: variant.sku,
              price: variant.price,
              compareAtPrice: variant.compareAtPrice,
              currency: variant.currency,
              barcode: variant.barcode,
              weight: variant.weight,
              isActive: variant.isActive ?? true,
            },
          });

          const resolvedOptionLinks = this.resolveVariantOptionLinks(
            variant,
            createdOptionsByKey,
          );

          if (resolvedOptionLinks.length > 0) {
            await tx.variantOptionValue.createMany({
              data: resolvedOptionLinks.map((optionLink) => ({
                variantId: createdVariant.id,
                optionId: optionLink.optionId,
                optionValueId: optionLink.optionValueId,
              })),
              skipDuplicates: true,
            });
          }

          if (variant.images?.length) {
            await tx.variantImage.createMany({
              data: variant.images.map((image, index) => ({
                variantId: createdVariant.id,
                imageUrl: image.imageUrl,
                altText: image.altText,
                position: image.position ?? index + 1,
              })),
            });
          }

          const targetLocationId = variant.locationId ?? defaultLocation?.id;
          if (!targetLocationId) {
            continue;
          }

          const initialStock = variant.initialStock ?? 0;

          await tx.variantInventory.create({
            data: {
              variantId: createdVariant.id,
              locationId: targetLocationId,
              quantity: initialStock,
              reserved: 0,
            },
          });

          if (initialStock > 0) {
            await tx.inventoryMovement.create({
              data: {
                variantId: createdVariant.id,
                locationId: targetLocationId,
                delta: initialStock,
                reason: 'INITIAL_STOCK',
              },
            });
          }
        }
      }

      return product.id;
    }, { timeout: 5000, maxWait: 2000 });

    return this.getProductById(productId);
  }
  /**
   * Duplicate a product with its options (and values), variants, and images.
   * Assumes variants do not need remapping to new optionValueIds; add mapping if needed.
   */
  async duplicateProduct(productId: number, newName: string) {
    const originalProduct =
      await this.productManagement.getProductById(productId);
    if (!originalProduct)
      throw new NotFoundException(`Product ${productId} not found`);

    const [options, variants, images] = await Promise.all([
      this.optionManagement.getProductOptions(productId),
      this.variantManagement.getVariantsByProductId(productId),
      this.imageManagement.getProductImages(productId),
    ]);

    // Create the new base product
    const newProduct = await this.productManagement.createProduct({
      name: newName,
      description: originalProduct.description ?? undefined,
      seoTitle: originalProduct.seoTitle ?? undefined,
      seoDescription: originalProduct.seoDescription ?? undefined,
      isActive: false,
    });

    // Duplicate options and values; track old->new option id mapping
    const optionIdMap = new Map<number, number>();
    for (const option of options) {
      const createdOption = await this.optionManagement.createProductOption({
        productId: newProduct.id,
        name: option.name,
        position: option.position,
        displayType: option.displayType ?? OptionDisplayType.text,
      });
      optionIdMap.set(option.id, createdOption.id);

      const optionWithValues = option as unknown as {
        displayType?: OptionDisplayType;
        optionValues?: {
          id: number;
          value: string;
          position?: number;
          meta?: Record<string, unknown> | null;
        }[];
      };
      if (optionWithValues.optionValues?.length) {
        for (const value of optionWithValues.optionValues) {
          await this.optionManagement.createOptionValue({
            optionId: createdOption.id,
            value: value.value,
            position: value.position,
            meta: value.meta ?? undefined,
          });
        }
      }
    }

    // Duplicate images in parallel (per-product)
    if (images?.length) {
      await Promise.all(
        images.map((img) =>
          this.imageManagement.addProductImage({
            productId: newProduct.id,
            imageUrl: img.imageUrl,
            altText: img.altText ?? undefined,
            position: img.position,
            isMain: img.isMain,
          }),
        ),
      );
    }

    // Duplicate variants (add mapping of option value IDs here if variants carry them)
    for (const variant of variants) {
      // If variant has optionValueIds tied to old options/values, remap here using a valueId map
      await this.variantManagement.createVariant({
        ...variant,
        id: undefined as unknown as never, // ensure new record if provider ignores id
        productId: newProduct.id,
      } as unknown as CreateVariantDto);
    }

    return this.productManagement.getProductById(newProduct.id);
  }

  /**
   * Wishlist APIs
   * */

  getMyWishList(id:number){
    return this.wishlistManagement.getMyWishlistCount(id)
  }

  getMyWishlistCount(id: number){
    return this.wishlistManagement.getMyWishlistCount(id)
  }

  addItemToMyWishlist(userId: number, dto: AddToWishlistDto) {
    return this.wishlistManagement.addItemToMyWishlist(userId, dto);
  }

  removeItemFromMyWishlist(userId: number, itemId: number) {
    return this.wishlistManagement.removeItemFromMyWishlist(userId, itemId);
  }

  clearMyWishlist(userId: number) {
    return this.wishlistManagement.clearMyWishlist(userId);
  }
}

