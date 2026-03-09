import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '@/generated/prisma/client';

type CodSettlementStatus =
  | typeof PaymentStatus.captured
  | typeof PaymentStatus.voided;

export class UpdateCodPaymentStatusDto {
  @ApiProperty({
    enum: [PaymentStatus.captured, PaymentStatus.voided],
    description: 'Allowed COD settlement status',
  })
  @IsEnum({
    captured: PaymentStatus.captured,
    voided: PaymentStatus.voided,
  })
  status: CodSettlementStatus;

  @ApiPropertyOptional({
    description: 'Optional settlement note',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
