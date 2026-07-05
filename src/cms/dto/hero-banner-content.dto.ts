import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const HERO_MEDIA_URL_PATTERN = /^(https?:\/\/|\/uploads\/).+/i;
const HERO_LINK_PATTERN = /^(https?:\/\/|\/(?!\/)).+/i;
const OBJECT_POSITION_PATTERN =
  /^(left|center|right|\d{1,3}%)( (top|center|bottom|\d{1,3}%))?$/i;

export class HeroSlideDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9_-]+$/)
  id: string;

  @IsString()
  @MaxLength(2048)
  @Matches(HERO_MEDIA_URL_PATTERN, {
    message: 'desktopImage must be an HTTP(S) URL or an /uploads/ path',
  })
  desktopImage: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @Matches(HERO_MEDIA_URL_PATTERN, {
    message: 'mobileImage must be an HTTP(S) URL or an /uploads/ path',
  })
  mobileImage?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  alt: string;

  @IsString()
  @MaxLength(2048)
  @Matches(HERO_LINK_PATTERN, {
    message: 'link must be an HTTP(S) URL or an internal absolute path',
  })
  link: string;

  @IsString()
  @Matches(OBJECT_POSITION_PATTERN)
  desktopObjectPosition: string;

  @IsOptional()
  @IsString()
  @Matches(OBJECT_POSITION_PATTERN)
  mobileObjectPosition?: string;

  @IsInt()
  @Min(1)
  position: number;

  @IsBoolean()
  isActive: boolean;
}

export class HeroBannerContentDto {
  @IsBoolean()
  isActive: boolean;

  @IsInt()
  @Min(2000)
  @Max(15000)
  autoplayMs: number;

  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => HeroSlideDto)
  slides: HeroSlideDto[];
}
