import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Auth } from '@/auth/decorator/auth.decorator';
import { Permissions } from '@/auth/decorator/permissions.decorator';
import { AuthType } from '@/auth/enums/auth-type.enum';
import { PaymentsService } from './payments.service';
import { UpdateCodPaymentStatusDto } from './dtos/update-cod-payment-status.dto';

@ApiTags('Admin Payments')
@Controller('admin/payments')
@Auth(AuthType.Bearer)
@ApiBearerAuth('JWT-auth')
export class PaymentsAdminController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Patch(':transactionId/status')
  @Permissions('payments:update')
  @HttpCode(HttpStatus.OK)
  updateCodPaymentStatus(
    @Param('transactionId') transactionId: string,
    @Body() dto: UpdateCodPaymentStatusDto,
  ) {
    return this.paymentsService.settleCodPayment(transactionId, dto);
  }
}
