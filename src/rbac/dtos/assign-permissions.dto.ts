import { IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class AssignPermissionsDto {
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  permissionIds: number[];
}
