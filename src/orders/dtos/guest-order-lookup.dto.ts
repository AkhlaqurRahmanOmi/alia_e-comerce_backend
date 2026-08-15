import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GuestOrderLookupDto {
  @ApiProperty({
    description: 'Guest phone number used during checkout',
    example: '01700000000',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(20)
  phone: string;

  @ApiProperty({
    description: 'Order confirmation number or external reference',
    example: 'ORD-2024-12345',
  })
  @IsString()
  orderReference: string;
}
