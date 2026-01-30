import { IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class AssignRolesDto {
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  roleIds: number[];
}
