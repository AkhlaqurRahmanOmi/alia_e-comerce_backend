import { IsString, IsNotEmpty } from 'class-validator';

export class CompletePaymentDto {
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;
}
