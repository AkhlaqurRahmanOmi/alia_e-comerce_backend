import { IsString, IsNotEmpty, IsOptional, MaxLength, Matches } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[a-z-]+:[a-z-]+$/, {
    message: 'Permission name must follow format "resource:action" (e.g., "users:create")',
  })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
