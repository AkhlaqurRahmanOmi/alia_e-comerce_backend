import { IsString, IsNotEmpty, Length, MaxLength, Matches, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCountryDto {
  @ApiProperty({
    description: 'ISO 3166-1 alpha-2 country code',
    example: 'FR',
    minLength: 2,
    maxLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 2, { message: 'Country code must be exactly 2 characters (ISO 3166-1 alpha-2)' })
  @Matches(/^[A-Z]{2}$/, { message: 'Country code must be 2 uppercase letters (e.g., US, FR, IT)' })
  code: string;

  @ApiProperty({
    description: 'Full country name',
    example: 'France',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Whether the country is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
