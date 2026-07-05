import { BadRequestException } from '@nestjs/common';
import { HomepageManagementProvider } from './homepage-management.provider';

describe('HomepageManagementProvider', () => {
  const homepageSectionRepo = {
    findHomepage: jest.fn(),
    create: jest.fn(),
    updateSection: jest.fn(),
  };
  const localFileStorageService = {
    uploadFile: jest.fn(),
  };

  let provider: HomepageManagementProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new HomepageManagementProvider(
      homepageSectionRepo as never,
      localFileStorageService as never,
    );
  });

  it('validates, sorts, and persists hero banner content', async () => {
    homepageSectionRepo.findHomepage.mockResolvedValue({ id: 1 });
    homepageSectionRepo.updateSection.mockImplementation(
      async (_id, columnName, content) => ({
        id: 1,
        [columnName]: content,
        updatedAt: new Date('2026-07-05T00:00:00.000Z'),
      }),
    );

    const content = {
      isActive: true,
      autoplayMs: 4500,
      slides: [
        {
          id: 'second-slide',
          desktopImage: 'https://example.com/second.webp',
          alt: 'Second slide',
          link: '/shop',
          desktopObjectPosition: 'center center',
          position: 2,
          isActive: true,
        },
        {
          id: 'first-slide',
          desktopImage: '/uploads/cms-media/first.webp',
          mobileImage: '/uploads/cms-media/first-mobile.webp',
          alt: 'First slide',
          link: '/shop/western',
          desktopObjectPosition: 'center center',
          mobileObjectPosition: 'center top',
          position: 1,
          isActive: true,
        },
      ],
    };

    const result = await provider.updateSection('hero-banner', content);

    expect(homepageSectionRepo.updateSection).toHaveBeenCalledWith(
      1,
      'heroBanner',
      expect.objectContaining({
        slides: [
          expect.objectContaining({ id: 'first-slide' }),
          expect.objectContaining({ id: 'second-slide' }),
        ],
      }),
    );
    expect(result.content.slides[0].id).toBe('first-slide');
  });

  it('rejects duplicate hero slide positions', async () => {
    const content = {
      isActive: true,
      autoplayMs: 4500,
      slides: [
        {
          id: 'first-slide',
          desktopImage: 'https://example.com/first.webp',
          alt: 'First slide',
          link: '/shop',
          desktopObjectPosition: 'center center',
          position: 1,
          isActive: true,
        },
        {
          id: 'second-slide',
          desktopImage: 'https://example.com/second.webp',
          alt: 'Second slide',
          link: '/shop',
          desktopObjectPosition: 'center center',
          position: 1,
          isActive: true,
        },
      ],
    };

    await expect(
      provider.updateSection('hero-banner', content),
    ).rejects.toThrow(BadRequestException);
    expect(homepageSectionRepo.findHomepage).not.toHaveBeenCalled();
  });

  it('returns only active hero slides in public homepage order', async () => {
    homepageSectionRepo.findHomepage.mockResolvedValue({
      heroBanner: {
        isActive: true,
        autoplayMs: 4500,
        slides: [
          {
            id: 'inactive',
            desktopImage: '/uploads/inactive.webp',
            position: 1,
            isActive: false,
          },
          {
            id: 'second',
            desktopImage: '/uploads/second.webp',
            position: 2,
            isActive: true,
          },
          {
            id: 'first',
            desktopImage: '/uploads/first.webp',
            position: 1,
            isActive: true,
          },
        ],
      },
    });

    const homepage = await provider.getHomepage();
    const heroBanner = homepage.heroBanner as { slides: { id: string }[] };

    expect(heroBanner.slides.map((slide) => slide.id)).toEqual([
      'first',
      'second',
    ]);
  });
});
