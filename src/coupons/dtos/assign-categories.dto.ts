import { IsArray, IsNumber } from 'class-validator';

export class AssignCategoriesDto {
  @IsArray()
  @IsNumber({}, { each: true })
  categoryIds: number[];
}
