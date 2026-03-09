import { Module } from '@nestjs/common';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';
import { HomepageManagementProvider } from './providers';
import { HomepageSectionRepository } from './repositories/homepage-section.repository';
import { PrismaModule } from '../core/config/prisma/prisma.module';
import { SharedModule } from '../shared/shared.module';
import { CmsMediaFileValidationPipe } from './pipes/cms-media-file-validation.pipe';

@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [CmsController],
  providers: [
    CmsService,
    // Repository
    HomepageSectionRepository,
    // Provider
    HomepageManagementProvider,
    CmsMediaFileValidationPipe,
  ],
  exports: [CmsService], // Export for other modules if needed
})
export class CmsModule {}
