import { IsBoolean } from 'class-validator';

export class UpdateVerificationStatusDto {
  @IsBoolean()
  isVerified: boolean;
}
