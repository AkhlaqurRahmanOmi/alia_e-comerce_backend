import { BadRequestException, Injectable } from '@nestjs/common';
// import { Product } from '../../generated/prisma/models/Product';
import { OptionDisplayType, Product } from '@/generated/prisma/client';
import Fuse  from 'fuse.js'
import { PrismaService } from '@/core/config/prisma/prisma.service';
import { BaseRepository } from '@/shared/repository/base.repository';
import {
  FilterOptions,
  PaginatedResult,
  QueryOptions,
} from '@/shared/types';
import {ProductFilterDto} from "../dtos";

@Injectable()
export class ProductRepository extends BaseRepository<Product, number> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private readonly hexColorRegex = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

  private validateOptionValueMeta(
    displayType: OptionDisplayType,
    meta: unknown,
    optionName: string,
    value: string,
  ): void {
    if (displayType === OptionDisplayType.text) {
      return;
    }

    if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
      throw new BadRequestException(
        `Option '${optionName}' requires object meta for value '${value}'`,
      );
    }

    const parsedMeta = meta as Record<string, unknown>;

    if (displayType === OptionDisplayType.color_swatch) {
      const hex = parsedMeta.hex;
      if (typeof hex !== 'string' || !this.hexColorRegex.test(hex.trim())) {
        throw new BadRequestException(
          `Option '${optionName}' requires meta.hex with valid hex color for value '${value}'`,
        );
      }
      return;
    }

    if (displayType === OptionDisplayType.image_swatch) {
      const imageUrl = parsedMeta.imageUrl;
      if (typeof imageUrl !== 'string' || imageUrl.trim().length === 0) {
        throw new BadRequestException(
          `Option '${optionName}' requires meta.imageUrl for value '${value}'`,
        );
      }
      return;
    }

    if (displayType === OptionDisplayType.pattern_swatch) {
      const pattern = parsedMeta.pattern;
      const imageUrl = parsedMeta.imageUrl;
      const hasPattern = typeof pattern === 'string' && pattern.trim().length > 0;
      const hasImageUrl =
        typeof imageUrl === 'string' && imageUrl.trim().length > 0;

      if (!hasPattern && !hasImageUrl) {
        throw new BadRequestException(
          `Option '${optionName}' requires meta.pattern or meta.imageUrl for value '${value}'`,
        );
      }
      return;
    }

    if (displayType === OptionDisplayType.number) {
      const numericValue = parsedMeta.numericValue;
      if (
        typeof numericValue !== 'number' ||
        !Number.isFinite(numericValue)
      ) {
        throw new BadRequestException(
          `Option '${optionName}' requires meta.numericValue for value '${value}'`,
        );
      }
    }
  }

  async findById(id: number): Promise<Product | null> {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        country: true,
        productSegments: {
          include: {
            segment: true,
          },
        },
        productImages: true,
        variants: {
          include: {
            variantInventories: true,
            variantOptionValues: {
              include: {
                productOption: true,
                optionValue: true,
              },
            },
          },
        },
        productCategories: {
          include: {
            category: {
              include: {
                parent: true,
              },
            },
          },
        },
        productOptions: {
          include: {
            optionValues: true,
          },
        },
        productAttributes: true,
        reviews:{
        },
        couponProducts: {
          include: {
            coupon: true,
          },
          where: {
            coupon: {
              isActive: true,
              startDate: { lte: new Date() },
              endDate: { gte: new Date() },
            },
          },
        }
      },
    });
  }

  async findAll(): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: { deletedAt: null },
      include: {
        country: true,
        productSegments: {
          include: {
            segment: true,
          },
        },
        productImages: {
          where: { isMain: true },
          take: 1,
        },
        variants: {
          take: 1,
          orderBy: { price: 'asc' },
          include: {
            variantInventories: true,
          },
        },
        reviews: true,
        couponProducts: {
          include: {
            coupon: true,
          },
          where: {
            coupon: {
              isActive: true,
              startDate: { lte: new Date() },
              endDate: { gte: new Date() },
            },
          },
        }
      },
    });
  }

  async create(data: Partial<Product>): Promise<Product> {
    return this.prisma.product.create({
      data: data as any,
      include: {
        country: true,
        productSegments: {
          include: {
            segment: true,
          },
        },
        productImages: true,
        variants: true,
      },
    });
  }

  async update(id: number, data: Partial<Product>): Promise<Product> {
    return this.prisma.product.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
      include: {
        country: true,
        productSegments: {
          include: {
            segment: true,
          },
        },
        productImages: true,
        variants: {
          include: {
            variantInventories: true,
            variantOptionValues: {
              include: {
                productOption: true,
                optionValue: true,
              },
            },
          },
        },
        productCategories: {
          include: {
            category: true,
          },
        },
      },
    });
  }

  async updateComplete(id: number, data: {
    productData: Partial<Product>;
    options?: any[];
    variants?: any[];
    images?: any[];
    categoryIds?: number[];
    segmentIds?: number[];
    attributes?: Array<{ name: string; value: string }>;
  }): Promise<Product> {
    return this.prisma.$transaction(async (tx) => {
      // Update base product
      if (Object.keys(data.productData).length > 0) {
        await tx.product.update({
          where: { id },
          data: { ...data.productData, updatedAt: new Date() },
        });
      }

      // Update/Create options (UPSERT approach)
      if (data.options !== undefined && data.options.length > 0) {
        // Get existing options for this product
        const existingOptions = await tx.productOption.findMany({
          where: { productId: id },
          include: {
            optionValues: true,
          },
        });

        // Process each option from the payload
        for (const optionData of data.options) {
          // Check if option exists by name
          const existingOption = existingOptions.find(o => o.name === optionData.name);
          const displayType =
            optionData.displayType ??
            existingOption?.displayType ??
            OptionDisplayType.text;

          if (optionData.values && optionData.values.length > 0) {
            optionData.values.forEach((val: any) => {
              this.validateOptionValueMeta(
                displayType,
                val.meta,
                optionData.name,
                val.value,
              );
            });
          }

          if (existingOption) {
            // UPDATE existing option
            await tx.productOption.update({
              where: { id: existingOption.id },
              data: {
                position: optionData.position ?? 1,
                displayType,
              },
            });

            // Update option values (delete old, create new)
            await tx.optionValue.deleteMany({
              where: { optionId: existingOption.id },
            });

            if (optionData.values && optionData.values.length > 0) {
              await tx.optionValue.createMany({
                data: optionData.values.map((val: any) => ({
                  optionId: existingOption.id,
                  value: val.value,
                  position: val.position ?? 1,
                  meta: val.meta,
                })),
              });
            }
          } else {
            // CREATE new option
            const newOption = await tx.productOption.create({
              data: {
                productId: id,
                name: optionData.name,
                position: optionData.position ?? 1,
                displayType,
              },
            });

            // Create option values
            if (optionData.values && optionData.values.length > 0) {
              await tx.optionValue.createMany({
                data: optionData.values.map((val: any) => ({
                  optionId: newOption.id,
                  value: val.value,
                  position: val.position ?? 1,
                  meta: val.meta,
                })),
              });
            }
          }
        }
      }

      // Update/Create variants (UPSERT approach - no deletion!)
      if (data.variants !== undefined && data.variants.length > 0) {
        const defaultLocation = await tx.location.findFirst({
          orderBy: { id: 'asc' },
          select: { id: true },
        });
        const existingVariants = await tx.variant.findMany({
          where: { productId: id },
          include: {
            variantOptionValues: true,
          },
        });
        const currentOptions = await tx.productOption.findMany({
          where: { productId: id },
          include: {
            optionValues: true,
          },
        });

        const optionLookup = new Map(
          currentOptions.map((option) => [
            option.name.trim().toLowerCase(),
            {
              id: option.id,
              valuesByKey: new Map(
                option.optionValues.map((value) => [
                  value.value.trim().toLowerCase(),
                  { id: value.id, value: value.value },
                ]),
              ),
            },
          ]),
        );

        const resolveVariantOptionLinks = (variantData: any) => {
          if (Array.isArray(variantData.optionValues) && variantData.optionValues.length > 0) {
            const uniqueLinks = new Map<string, { optionId: number; optionValueId: number }>();
            for (const optionValue of variantData.optionValues) {
              if (!optionValue?.optionId || !optionValue?.optionValueId) {
                continue;
              }

              uniqueLinks.set(`${optionValue.optionId}:${optionValue.optionValueId}`, {
                optionId: optionValue.optionId,
                optionValueId: optionValue.optionValueId,
              });
            }

            return Array.from(uniqueLinks.values());
          }

          if (!Array.isArray(variantData.optionSelections) || variantData.optionSelections.length === 0) {
            return [];
          }

          const uniqueLinks = new Map<string, { optionId: number; optionValueId: number }>();

          for (const selection of variantData.optionSelections) {
            const optionKey = selection.optionName?.trim().toLowerCase();
            const valueKey = selection.optionValue?.trim().toLowerCase();
            const optionRecord = optionKey ? optionLookup.get(optionKey) : undefined;

            if (!optionRecord) {
              throw new BadRequestException(
                `Variant '${variantData.sku}' references unknown option '${selection.optionName}'.`,
              );
            }

            const valueRecord = valueKey
              ? optionRecord.valuesByKey.get(valueKey)
              : undefined;

            if (!valueRecord) {
              throw new BadRequestException(
                `Variant '${variantData.sku}' references unknown value '${selection.optionValue}' for option '${selection.optionName}'.`,
              );
            }

            uniqueLinks.set(`${optionRecord.id}:${valueRecord.id}`, {
              optionId: optionRecord.id,
              optionValueId: valueRecord.id,
            });
          }

          return Array.from(uniqueLinks.values());
        };

        for (const variantData of data.variants) {
          const existingVariant = existingVariants.find(v => v.sku === variantData.sku);
          const resolvedOptionLinks = resolveVariantOptionLinks(variantData);

          if (existingVariant) {
            await tx.variant.update({
              where: { id: existingVariant.id },
              data: {
                price: variantData.price,
                compareAtPrice: variantData.compareAtPrice,
                currency: variantData.currency,
                barcode: variantData.barcode,
                weight: variantData.weight,
                isActive: variantData.isActive ?? true,
                updatedAt: new Date(),
              },
            });

            await tx.variantOptionValue.deleteMany({
              where: { variantId: existingVariant.id },
            });

            if (resolvedOptionLinks.length > 0) {
              await tx.variantOptionValue.createMany({
                data: resolvedOptionLinks.map((optionLink) => ({
                  variantId: existingVariant.id,
                  optionId: optionLink.optionId,
                  optionValueId: optionLink.optionValueId,
                })),
              });
            }
          } else {
            const newVariant = await tx.variant.create({
              data: {
                productId: id,
                sku: variantData.sku,
                price: variantData.price,
                compareAtPrice: variantData.compareAtPrice,
                currency: variantData.currency,
                barcode: variantData.barcode,
                weight: variantData.weight,
                isActive: variantData.isActive ?? true,
              },
            });

            if (resolvedOptionLinks.length > 0) {
              await tx.variantOptionValue.createMany({
                data: resolvedOptionLinks.map((optionLink) => ({
                  variantId: newVariant.id,
                  optionId: optionLink.optionId,
                  optionValueId: optionLink.optionValueId,
                })),
              });
            }

            const targetLocationId = variantData.locationId ?? defaultLocation?.id;
            if (!targetLocationId) {
              continue;
            }

            const initialStock = variantData.initialStock ?? 0;

            await tx.variantInventory.create({
              data: {
                variantId: newVariant.id,
                locationId: targetLocationId,
                quantity: initialStock,
                reserved: 0,
              },
            });

            if (initialStock > 0) {
              await tx.inventoryMovement.create({
                data: {
                  variantId: newVariant.id,
                  locationId: targetLocationId,
                  delta: initialStock,
                  reason: 'INITIAL_STOCK',
                },
              });
            }
          }
        }
      }
      // Replace images if provided
      if (data.images !== undefined) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (data.images.length > 0) {
          await tx.productImage.createMany({
            data: data.images.map((image, index) => ({
              productId: id,
              imageUrl: image.imageUrl,
              altText: image.altText,
              position: image.position ?? index,
              isMain: image.isMain ?? index === 0,
            }))
          });
        }
      }

      // Replace category assignments if provided
      if (data.categoryIds !== undefined) {
        await tx.productCategory.deleteMany({ where: { productId: id } });
        if (data.categoryIds.length > 0) {
          await tx.productCategory.createMany({
            data: data.categoryIds.map((categoryId) => ({
              productId: id,
              categoryId,
            })),
            skipDuplicates: true,
          });
        }
      }

      // Replace segment assignments if provided
      if (data.segmentIds !== undefined) {
        await tx.productSegment.deleteMany({ where: { productId: id } });
        if (data.segmentIds.length > 0) {
          const uniqueSegmentIds = [...new Set(data.segmentIds)];
          await tx.productSegment.createMany({
            data: uniqueSegmentIds.map((segmentId) => ({
              productId: id,
              segmentId,
            })),
            skipDuplicates: true,
          });
        }
      }

      // Replace attributes if provided
      if (data.attributes !== undefined) {
        await tx.productAttribute.deleteMany({ where: { productId: id } });
        if (data.attributes.length > 0) {
          await tx.productAttribute.createMany({
            data: data.attributes.map((attribute) => ({
              productId: id,
              name: attribute.name,
              value: attribute.value,
            })),
            skipDuplicates: true,
          });
        }
      }

      // Return the updated product with relations
      return tx.product.findUnique({
        where: { id },
        include: {
          country: true,
          productSegments: {
            include: {
              segment: true,
            },
          },
          productImages: true,
          variants: {
            include: {
              variantInventories: true,
              variantOptionValues: {
                include: {
                  productOption: true,
                  optionValue: true,
                },
              },
            },
          },
          productCategories: {
            include: {
              category: {
                include: {
                  parent: true,
                },
              },
            },
          },
          productOptions: {
            include: {
              optionValues: true,
            },
          },
          productAttributes: true,
          reviews: {},
          couponProducts: {
            include: {
              coupon: true,
            },
            where: {
              coupon: {
                isActive: true,
                startDate: { lte: new Date() },
                endDate: { gte: new Date() },
              },
            },
          }
        },
      }) as Promise<Product>;
    }, {
      maxWait: 10000, // 10 seconds max wait
      timeout: 15000, // 15 seconds timeout
    });
  }

  async delete(id: number): Promise<void> {
    // Soft delete
    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findWithFilters(options: QueryOptions): Promise<PaginatedResult<Product>> {
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
      deletedAt: null,
      isActive: true,
      ...filters,
    };

    const segmentKey =
      typeof filters.segmentKey === 'string' ? filters.segmentKey.trim() : '';
    if (filters.segmentKey !== undefined) {
      delete where.segmentKey;
    }

    if (segmentKey) {
      where.productSegments = {
        some: {
          segment: {
            key: segmentKey,
            isActive: true,
          },
        },
      };
    }

    // Add search functionality
    if (search?.query) {
      where.OR = search.fields.map((field) => ({
        [field]: {
          contains: search.query,
          mode: 'insensitive',
        },
      }));
    }

    // Handle price filtering from filters object
    if (filters.minPrice || filters.maxPrice) {
      const priceConditions: any = {};
      if (filters.minPrice) priceConditions.gte = filters.minPrice;
      if (filters.maxPrice) priceConditions.lte = filters.maxPrice;

      where.variants = {
        some: {
          isActive: true,
          price: priceConditions,
        },
      };

      delete where.minPrice;
      delete where.maxPrice;
    }

    // Store minRating for post-filtering and remove from where clause
    // Note: Prisma doesn't support AVG aggregation in WHERE clause directly
    // We need to use raw query or filter after fetch for complex aggregations
    const minRating = filters.minRating;
    if (filters.minRating) {
      delete where.minRating;
    }

    // If minRating filter is present, we'll use a subquery approach
    // Fetch products with review aggregation
    let products: any[];
    let total: number;

    if (minRating) {
      // Use Prisma's groupBy and aggregation for better performance
      // First, get product IDs that meet the rating criteria
      const productsWithRatings = await this.prisma.review.groupBy({
        by: ['productId'],
        _avg: {
          rating: true,
        },
        having: {
          rating: {
            _avg: {
              gte: minRating,
            },
          },
        },
      });

      const qualifiedProductIds = productsWithRatings.map(p => p.productId);

      // Add qualified product IDs to where clause
      where.id = {
        in: qualifiedProductIds,
      };

      // Now fetch products with the rating filter applied
      [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          skip,
          take: limit,
          orderBy: sort ? { [sort.field]: sort.order } : { createdAt: 'desc' },
          include: {
            country: true,
            productSegments: {
              include: {
                segment: true,
              },
            },
            productImages: {
              where: { isMain: true },
              take: 1,
            },
            variants: {
              where: { isActive: true },
              orderBy: { price: 'asc' },
              include: {
                variantInventories: true,
              },
            },
            productCategories: {
              include: {
                category: {
                  include: {
                    parent: true,
                  },
                },
              },
            },
            reviews: {
              select: {
                rating: true,
              },
            },
            couponProducts: {
              include: {
                coupon: true,
              },
              where: {
                coupon: {
                  isActive: true,
                  startDate: { lte: new Date() },
                  endDate: { gte: new Date() },
                },
              },
            },
          },
        }),
        this.prisma.product.count({ where }),
      ]);
    } else {
      // No rating filter - standard query
      [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          skip,
          take: limit,
          orderBy: sort ? { [sort.field]: sort.order } : { createdAt: 'desc' },
          include: {
            country: true,
            productSegments: {
              include: {
                segment: true,
              },
            },
            productImages: {
              where: { isMain: true },
              take: 1,
            },
            variants: {
              where: { isActive: true },
              orderBy: { price: 'asc' },
              include: {
                variantInventories: true,
              },
            },
            productCategories: {
              include: {
                category: {
                  include: {
                    parent: true,
                  },
                },
              },
            },
            reviews: {
              select: {
                rating: true,
              },
            },
            couponProducts: {
              include: {
                coupon: true,
              },
              where: {
                coupon: {
                  isActive: true,
                  startDate: { lte: new Date() },
                  endDate: { gte: new Date() },
                },
              },
            },
          },
        }),
        this.prisma.product.count({ where }),
      ]);
    }

    return {
      data: products,
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




  async search(query: string, fields: string[]): Promise<Product[]> {
    const where: any = {
      deletedAt: null,
      OR: fields.map((field) => ({
        [field]: {
          contains: query,
          mode: 'insensitive',
        },
      })),
    };

    return this.prisma.product.findMany({
      where,
      include: {
        country: true,
        productSegments: {
          include: {
            segment: true,
          },
        },
        productImages: {
          where: { isMain: true },
          take: 1,
        },
        variants: {
          take: 1,
          orderBy: { price: 'asc' },
        },
        reviews: true,
        couponProducts: {
          include: {
            coupon: true,
          },
          where: {
            coupon: {
              isActive: true,
              startDate: { lte: new Date() },
              endDate: { gte: new Date() },
            },
          },
        }
      },
    });
  }

  async countTotal(filters?: FilterOptions): Promise<number> {
    return this.prisma.product.count({
      where: {
        deletedAt: null,
        ...filters,
      },
    });
  }

  // Catalog-specific methods
  async findWithCategories(categoryId: number): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        productCategories: {
          some: {
            categoryId,
          },
        },
      },
      include: {
        country: true,
        productSegments: {
          include: {
            segment: true,
          },
        },
        productImages: {
          where: { isMain: true },
          take: 1,
        },
        variants: {
          take: 1,
          orderBy: { price: 'asc' },
          include: {
            variantInventories: true,
          },
        },
        reviews: true,
        couponProducts: {
          include: {
            coupon: true,
          },
          where: {
            coupon: {
              isActive: true,
              startDate: { lte: new Date() },
              endDate: { gte: new Date() },
            },
          },
        }
      },
    });
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return this.prisma.product.findUnique({
      where: { seoSlug: slug },
      include: {
        country: true,
        productSegments: {
          include: {
            segment: true,
          },
        },
        productImages: true,
        variants: {
          include: {
            variantInventories: true,
            variantOptionValues: {
              include: {
                productOption: true,
                optionValue: true,
              },
            },
          },
        },
        productCategories: {
          include: {
            category: true,
          },
        },
        productOptions: {
          include: {
            optionValues: true,
          },
        },
        productAttributes: true,
        reviews: true,
        couponProducts: {
          include: {
            coupon: true,
          },
          where: {
            coupon: {
              isActive: true,
              startDate: { lte: new Date() },
              endDate: { gte: new Date() },
            },
          },
        }
      },
    });
  }

  async findActiveProducts(): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: {
        deletedAt: null,
        isActive: true,
      },
      include: {
        country: true,
        productSegments: {
          include: {
            segment: true,
          },
        },
        productImages: {
          where: { isMain: true },
          take: 1,
        },
        variants: {
          where: { isActive: true },
          take: 1,
          orderBy: { price: 'asc' },
        },
        reviews: true,
        couponProducts: {
          include: {
            coupon: true,
          },
          where: {
            coupon: {
              isActive: true,
              startDate: { lte: new Date() },
              endDate: { gte: new Date() },
            },
          },
        }
      },
    });
  }

    async searchProducts(query: string, filters: ProductFilterDto) {
        // ✅ OPTIMIZED: First filter at database level, then apply fuzzy search
        // This prevents loading ALL products into memory

        const page = filters.page || 1;
        const limit = filters.limit || 20; // Default limit for search

        // Step 1: Database-level filtering with text search
        // This significantly reduces the dataset before fuzzy matching
        const products = await this.prisma.product.findMany({
            where: {
                isActive: true,
                deletedAt: null,
                // Pre-filter with database text search for better performance
                OR: [
                    {
                        name: {
                            contains: query,
                            mode: 'insensitive',
                        },
                    },
                    {
                        description: {
                            contains: query,
                            mode: 'insensitive',
                        },
                    },
                    {
                        seoKeywords: {
                            contains: query,
                            mode: 'insensitive',
                        },
                    },
                ],
            },
            // ✅ FIXED: Apply pagination to limit memory usage
            take: limit * 3, // Get 3x limit for fuzzy matching, then paginate
            include: {
                country: true,
                productSegments: {
                    include: {
                        segment: true,
                    },
                },
                variants: {
                    where: { isActive: true },
                    take: 1,
                    orderBy: { price: 'asc' },
                    include: {
                        variantInventories: true,
                    },
                },
                productCategories: {
                    include: { category: true }
                },
                reviews: {
                    select: {
                        rating: true,
                    },
                },
                productImages: {
                    where: { isMain: true },
                    take: 1,
                },
                couponProducts: {
                    include: {
                        coupon: true,
                    },
                    where: {
                        coupon: {
                            isActive: true,
                            startDate: { lte: new Date() },
                            endDate: { gte: new Date() },
                        },
                    },
                },
            },
        });

        // Step 2: Apply fuzzy search for better matching on filtered results
        // This is now operating on a much smaller dataset
        if (products.length === 0) {
            return {
                data: [],
                pagination: {
                    currentPage: page,
                    totalPages: 0,
                    totalItems: 0,
                    itemsPerPage: limit,
                    hasNext: false,
                    hasPrev: false,
                },
            };
        }

        const fuse = new Fuse(products, {
            keys: [
                { name: 'name', weight: 0.7 },
                { name: 'description', weight: 0.3 },
            ],
            threshold: 0.4,
            includeScore: true,
            minMatchCharLength: 2,
        });

        const searchResults = fuse.search(query).map(result => result.item);

        // Step 3: Apply pagination to fuzzy search results
        const skip = (page - 1) * limit;
        const paginatedResults = searchResults.slice(skip, skip + limit);
        const total = searchResults.length;

        return {
            data: paginatedResults,
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

  async setProductSegments(productId: number, segmentIds: number[]): Promise<void> {
    await this.prisma.productSegment.deleteMany({
      where: { productId },
    });

    if (segmentIds.length === 0) {
      return;
    }

    const uniqueSegmentIds = [...new Set(segmentIds)];
    await this.prisma.productSegment.createMany({
      data: uniqueSegmentIds.map((segmentId) => ({
        productId,
        segmentId,
      })),
      skipDuplicates: true,
    });
  }

  async getProductSegments(productId: number) {
    return this.prisma.productSegment.findMany({
      where: { productId },
      include: {
        segment: true,
      },
      orderBy: {
        assignedAt: 'asc',
      },
    });
  }

}

