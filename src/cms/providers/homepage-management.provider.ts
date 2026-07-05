import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { HomepageSection } from '@/generated/prisma/client';
import { HomepageSectionRepository } from '../repositories/homepage-section.repository';
import { LocalFileStorageService } from '@/shared/services/local-file-storage.service';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { HeroBannerContentDto } from '../dto/hero-banner-content.dto';

/**
 * HomepageManagementProvider - Business logic for CMS homepage sections
 * Handles 10 static sections stored in a single database row
 */
@Injectable()
export class HomepageManagementProvider {
  private readonly logger = new Logger(HomepageManagementProvider.name);

  // Map of URL-friendly section names to database column names
  // ONLY STATIC SECTIONS (Dynamic sections use existing APIs)
  private readonly SECTION_MAP = {
    'header': 'header',
    'hero-banner': 'heroBanner',
    'media-carousel-primary': 'mediaCarouselPrimary',
    'media-carousel-secondary': 'mediaCarouselSecondary',
    'media-carousel-tertiary': 'mediaCarouselTertiary',
    'features-bar': 'featuresBar',
    'our-story': 'ourStory',
    'store-locations': 'storeLocations',
    'footer': 'footer',
  } as const;

  constructor(
    private readonly homepageSectionRepo: HomepageSectionRepository,
    private readonly localFileStorageService: LocalFileStorageService,
  ) {}

  /**
   * Get homepage for public display
   * Returns simple object structure for frontend
   * ONLY static sections - dynamic sections use existing APIs
   */
  async getHomepage(): Promise<Record<string, any>> {
    this.logger.log('Fetching homepage static sections');
    const homepage = await this.homepageSectionRepo.findHomepage();

    if (!homepage) {
      throw new NotFoundException('Homepage not configured yet');
    }

    // Return only static sections as simple object
    return {
      header: homepage.header || null,
      heroBanner: this.getPublicHeroBanner(homepage.heroBanner),
      mediaCarouselPrimary: homepage.mediaCarouselPrimary || null,
      mediaCarouselSecondary: homepage.mediaCarouselSecondary || null,
      mediaCarouselTertiary: homepage.mediaCarouselTertiary || null,
      featuresBar: homepage.featuresBar || null,
      ourStory: homepage.ourStory || null,
      storeLocations: homepage.storeLocations || null,
      footer: homepage.footer || null,
    };
  }

  /**
   * Get homepage record for admin (includes full database record)
   */
  async getHomepageForAdmin(): Promise<HomepageSection | null> {
    this.logger.log('Fetching homepage data for admin');
    return this.homepageSectionRepo.findHomepage();
  }

  /**
   * Update a specific section
   * @param sectionName - URL-friendly section name (e.g., 'hero-banner')
   * @param content - Section content as JSON
   */
  async updateSection(
    sectionName: string,
    content: Record<string, unknown>,
  ): Promise<any> {
    // Validate section name
    const columnName = this.SECTION_MAP[sectionName as keyof typeof this.SECTION_MAP];

    if (!columnName) {
      const validSections = Object.keys(this.SECTION_MAP).join(', ');
      throw new BadRequestException(
        `Invalid section name: ${sectionName}. Valid sections: ${validSections}`,
      );
    }

    const validatedContent = await this.validateSectionContent(
      sectionName,
      content,
    );

    this.logger.log(`Updating section: ${sectionName} (column: ${columnName})`);

    // Get or create homepage record
    let homepage = await this.homepageSectionRepo.findHomepage();

    if (!homepage) {
      // First time setup - create the row with this section
      this.logger.log('Creating initial homepage record');
      homepage = await this.homepageSectionRepo.create({
        [columnName]: validatedContent,
      });
    } else {
      // Update existing row
      homepage = await this.homepageSectionRepo.updateSection(
        homepage.id,
        columnName,
        validatedContent,
      );
    }

    // Return the updated section data
    return {
      section: sectionName,
      content: homepage[columnName],
      updatedAt: homepage.updatedAt,
    };
  }

  /**
   * Validate section content structure (optional - can add custom validation)
   */
  private async validateSectionContent(
    sectionName: string,
    content: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    if (sectionName !== 'hero-banner') {
      return content;
    }

    const heroBanner = plainToInstance(HeroBannerContentDto, content);
    const validationErrors = await validate(heroBanner, {
      whitelist: true,
      forbidNonWhitelisted: true,
      validationError: {
        target: false,
        value: false,
      },
    });

    if (validationErrors.length > 0) {
      throw new BadRequestException({
        message: 'Invalid hero banner content',
        errors: validationErrors,
      });
    }

    const slideIds = new Set<string>();
    const positions = new Set<number>();

    for (const slide of heroBanner.slides) {
      if (slideIds.has(slide.id)) {
        throw new BadRequestException(`Duplicate hero slide id: ${slide.id}`);
      }

      if (positions.has(slide.position)) {
        throw new BadRequestException(
          `Duplicate hero slide position: ${slide.position}`,
        );
      }

      slideIds.add(slide.id);
      positions.add(slide.position);
    }

    return {
      isActive: heroBanner.isActive,
      autoplayMs: heroBanner.autoplayMs,
      slides: [...heroBanner.slides].sort(
        (left, right) => left.position - right.position,
      ),
    };
  }

  private getPublicHeroBanner(content: unknown): Record<string, unknown> | null {
    if (!content || typeof content !== 'object' || Array.isArray(content)) {
      return null;
    }

    const heroBanner = content as Record<string, unknown>;
    if (!Array.isArray(heroBanner.slides)) {
      return null;
    }

    const slides = heroBanner.slides
      .filter((slide): slide is Record<string, unknown> => {
        return (
          Boolean(slide) &&
          typeof slide === 'object' &&
          !Array.isArray(slide) &&
          slide.isActive !== false &&
          typeof slide.desktopImage === 'string'
        );
      })
      .sort((left, right) => {
        const leftPosition =
          typeof left.position === 'number' ? left.position : Number.MAX_VALUE;
        const rightPosition =
          typeof right.position === 'number'
            ? right.position
            : Number.MAX_VALUE;

        return leftPosition - rightPosition;
      });

    return {
      ...heroBanner,
      slides,
    };
  }

  async uploadMediaAsset(file: Express.Multer.File) {
    this.logger.log(`Uploading CMS media asset: ${file.originalname}`);

    return this.localFileStorageService.uploadFile(file, 'cms-media');
  }
}
