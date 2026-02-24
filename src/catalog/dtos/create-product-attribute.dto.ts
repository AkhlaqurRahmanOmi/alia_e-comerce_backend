import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateProductAttributeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  value: string;
}
