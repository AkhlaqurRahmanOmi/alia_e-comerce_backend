import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GuestOrderLookupDto {
  @ApiProperty({
    description: 'Guest email address used during checkout',
    example: 'guest@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Order confirmation number or external reference',
    example: 'ORD-2024-12345',
  })
  @IsString()
  orderReference: string;
}
