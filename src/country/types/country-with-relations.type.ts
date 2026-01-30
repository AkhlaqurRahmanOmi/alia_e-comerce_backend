import { Country } from '@prisma/client';

/**
 * Country with related product information
 */
export type CountryWithRelations = Country & {
  products?: Array<{
    id: number;
    name: string;
  }>;
  _count?: {
    products: number;
  };
};

/**
 * Response type for country deletion
 */
export type CountryDeleteResponse = {
  message: string;
};

/**
 * Response type for country count
 */
export type CountryCountResponse = {
  count: number;
};
