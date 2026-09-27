import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
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
  ProductRepository,
  VariantRepository,
  CategoryRepository,
  WishlistRepository,
  SegmentRepository,
} from './repositories';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [CatalogController],
  providers: [
    CatalogService,
    // Repositories
    ProductRepository,
    VariantRepository,
    CategoryRepository,
    WishlistRepository,
    SegmentRepository,
    // Providers (exported for reusability in other modules)
    ProductManagementProvider,
    VariantManagementProvider,
    VariantGenerationProvider,
    CategoryManagementProvider,
    SegmentManagementProvider,
    ImageManagementProvider,
    OptionManagementProvider,
    //wishlist provider
    WishlistManagementProvider,
  ],
  exports: [CatalogService],
})
export class CatalogModule {}
