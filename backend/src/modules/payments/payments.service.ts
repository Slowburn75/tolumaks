import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { InitializePaymentDto, VerifyPaymentDto } from './payments.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  private async getPaystackHeaders() {
    const secretKey = process.env.PAYSTACK_SECRET_KEY || '';
    return {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  private async getFlutterwaveHeaders() {
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY || '';
    return {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  /** Compare gateway amount (kobo for Paystack, major units for FLW) to order total */
  private amountsMatch(orderTotal: number, paidAmount: number, unit: 'kobo' | 'major' = 'major'): boolean {
    const expected = unit === 'kobo' ? Math.round(orderTotal * 100) : Number(orderTotal);
    const paid = Number(paidAmount);
    // allow 1 unit float tolerance
    return Math.abs(expected - paid) < 1.01;
  }

  private async markOrderPaid(orderId: string, provider: string, reference: string, transactionId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentStatus === 'PAID') {
      return { message: 'Already paid', orderId };
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'PAID', status: 'PAID', paidAt: new Date() },
    });

    await this.prisma.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        provider,
        reference,
        transactionId,
        status: 'success',
        amount: order.total,
        currency: 'NGN',
      },
      update: {
        reference,
        transactionId,
        status: 'success',
        provider,
      },
    });

    return { message: 'Payment verified successfully', orderId: order.id };
  }

  async initializePaystack(userId: string, dto: InitializePaymentDto) {
    throw new BadRequestException('Card payments are temporarily unavailable. Please pay by bank transfer.');
  }

  async verifyPaystack(userId: string, dto: VerifyPaymentDto) {
    const headers = await this.getPaystackHeaders();
    const response = await fetch(`https://api.paystack.co/transaction/verify/${dto.reference}`, { headers });
    const data = await response.json();

    if (!data.status || data.data.status !== 'success') {
      throw new HttpException('Payment verification failed', HttpStatus.BAD_REQUEST);
    }

    const metadata = data.data.metadata || {};
    const order = await this.prisma.order.findUnique({ where: { id: metadata.orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new ForbiddenException('You can only verify your own payments');

    if (!this.amountsMatch(Number(order.total), data.data.amount, 'kobo')) {
      throw new BadRequestException('Paid amount does not match order total');
    }
    if ((data.data.currency || 'NGN').toUpperCase() !== 'NGN') {
      throw new BadRequestException('Unexpected payment currency');
    }

    return this.markOrderPaid(order.id, 'paystack', dto.reference, String(data.data.id));
  }

  async initializeFlutterwave(userId: string, dto: InitializePaymentDto) {
    throw new BadRequestException('Card payments are temporarily unavailable. Please pay by bank transfer.');
  }

  async verifyFlutterwave(userId: string, dto: VerifyPaymentDto) {
    const headers = await this.getFlutterwaveHeaders();
    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${dto.reference}`,
      { headers },
    );
    const data = await response.json();

    if (data.status !== 'success' || data.data.status !== 'successful') {
      throw new HttpException('Payment verification failed', HttpStatus.BAD_REQUEST);
    }

    const meta = data.data.meta || {};
    const order = await this.prisma.order.findUnique({ where: { id: meta.orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new ForbiddenException('You can only verify your own payments');

    if (!this.amountsMatch(Number(order.total), data.data.amount, 'major')) {
      throw new BadRequestException('Paid amount does not match order total');
    }

    return this.markOrderPaid(order.id, 'flutterwave', dto.reference, String(data.data.id));
  }

  verifyPaystackSignature(rawBody: Buffer | string | undefined, signature: string | undefined): void {
    const secret = process.env.PAYSTACK_SECRET_KEY || '';
    if (!secret) throw new UnauthorizedException('Paystack not configured');
    if (!signature || !rawBody) throw new UnauthorizedException('Missing webhook signature');

    const hash = createHmac('sha512', secret)
      .update(typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8'))
      .digest('hex');

    try {
      const a = Buffer.from(hash);
      const b = Buffer.from(signature);
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        throw new UnauthorizedException('Invalid Paystack signature');
      }
    } catch {
      throw new UnauthorizedException('Invalid Paystack signature');
    }
  }

  verifyFlutterwaveSignature(signature: string | undefined): void {
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH || process.env.FLUTTERWAVE_WEBHOOK_HASH || '';
    if (!secretHash) throw new UnauthorizedException('Flutterwave webhook hash not configured');
    if (!signature || signature !== secretHash) {
      throw new UnauthorizedException('Invalid Flutterwave signature');
    }
  }

  async handlePaystackWebhook(payload: any) {
    const event = payload.event;
    if (event === 'charge.success') {
      const reference = payload.data.reference;
      const metadata = payload.data.metadata || {};
      if (metadata?.orderId) {
        const order = await this.prisma.order.findUnique({ where: { id: metadata.orderId } });
        if (order && order.paymentStatus !== 'PAID') {
          if (!this.amountsMatch(Number(order.total), payload.data.amount, 'kobo')) {
            return { message: 'Amount mismatch — ignored' };
          }
          await this.markOrderPaid(order.id, 'paystack', reference, String(payload.data.id));
        }
      }
    }
    return { message: 'Webhook processed' };
  }

  async handleFlutterwaveWebhook(payload: any) {
    if (payload.event === 'charge.completed' && payload.data?.status === 'successful') {
      const txRef = payload.data.tx_ref;
      const meta = payload.data.meta || {};
      if (meta.orderId) {
        const order = await this.prisma.order.findUnique({ where: { id: meta.orderId } });
        if (order && order.paymentStatus !== 'PAID') {
          if (!this.amountsMatch(Number(order.total), payload.data.amount, 'major')) {
            return { message: 'Amount mismatch — ignored' };
          }
          await this.markOrderPaid(order.id, 'flutterwave', txRef, String(payload.data.id));
        }
      }
    }
    return { message: 'Webhook processed' };
  }
}
