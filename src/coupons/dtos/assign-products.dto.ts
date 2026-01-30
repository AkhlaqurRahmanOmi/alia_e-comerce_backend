import { IsArray, IsNumber } from 'class-validator';

export class AssignProductsDto {
  @IsArray()
  @IsNumber({}, { each: true })
  productIds: number[];
}
