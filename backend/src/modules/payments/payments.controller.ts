import { Controller, Post, Body, UseGuards, Req, Headers, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { InitializePaymentDto, VerifyPaymentDto } from './payments.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('paystack/initialize')
  @UseGuards(JwtAuthGuard)
  async initializePaystack(@CurrentUser('id') userId: string, @Body() dto: InitializePaymentDto) {
    return this.paymentsService.initializePaystack(userId, dto);
  }

  @Post('paystack/verify')
  @UseGuards(JwtAuthGuard)
  async verifyPaystack(@CurrentUser('id') userId: string, @Body() dto: VerifyPaymentDto) {
    return this.paymentsService.verifyPaystack(userId, dto);
  }

  @Post('flutterwave/initialize')
  @UseGuards(JwtAuthGuard)
  async initializeFlutterwave(@CurrentUser('id') userId: string, @Body() dto: InitializePaymentDto) {
    return this.paymentsService.initializeFlutterwave(userId, dto);
  }

  @Post('flutterwave/verify')
  @UseGuards(JwtAuthGuard)
  async verifyFlutterwave(@CurrentUser('id') userId: string, @Body() dto: VerifyPaymentDto) {
    return this.paymentsService.verifyFlutterwave(userId, dto);
  }

  @Post('webhook/paystack')
  async handlePaystackWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Body() payload: any,
    @Headers('x-paystack-signature') signature?: string,
  ) {
    const raw = req.rawBody || Buffer.from(JSON.stringify(payload));
    this.paymentsService.verifyPaystackSignature(raw, signature);
    return this.paymentsService.handlePaystackWebhook(payload);
  }

  @Post('webhook/flutterwave')
  async handleFlutterwaveWebhook(
    @Body() payload: any,
    @Headers('verif-hash') signature?: string,
  ) {
    this.paymentsService.verifyFlutterwaveSignature(signature);
    return this.paymentsService.handleFlutterwaveWebhook(payload);
  }
}
