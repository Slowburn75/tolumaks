import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../auth/email.service';
import { ContactDto } from './newsletter.dto';

@Injectable()
export class NewsletterService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async subscribe(email: string) {
    const existing = await this.prisma.newsletterSubscriber.findUnique({ where: { email } });
    if (existing) {
      if (existing.isActive) {
        throw new ConflictException('Email already subscribed');
      }
      await this.prisma.newsletterSubscriber.update({
        where: { email },
        data: { isActive: true },
      });
      return { message: 'Successfully re-subscribed to newsletter' };
    }

    await this.prisma.newsletterSubscriber.create({ data: { email } });
    return { message: 'Successfully subscribed to newsletter' };
  }

  async unsubscribe(email: string) {
    const existing = await this.prisma.newsletterSubscriber.findUnique({ where: { email } });
    if (!existing) {
      return { message: 'Email not found in subscribers' };
    }

    await this.prisma.newsletterSubscriber.update({
      where: { email },
      data: { isActive: false },
    });

    return { message: 'Successfully unsubscribed from newsletter' };
  }

  async deleteSubscriber(id: string) {
    await this.prisma.newsletterSubscriber.delete({ where: { id } });
    return { message: 'Subscriber deleted successfully' };
  }

  async submitContact(dto: ContactDto) {
    const saved = await this.prisma.contactMessage.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        subject: dto.subject,
        message: dto.message,
      },
    });

    try {
      await this.emailService.sendContactNotification(dto);
    } catch {
      // stored even if email fails
    }

    return { message: 'Message received. We will get back to you soon.', id: saved.id };
  }

  async getSubscribers(page?: number, limit?: number) {
    const p = page && !isNaN(page) ? page : 1;
    const l = limit && !isNaN(limit) ? limit : 20;
    const skip = (p - 1) * l;

    const [subscribers, total] = await Promise.all([
      this.prisma.newsletterSubscriber.findMany({
        where: { isActive: true },
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.newsletterSubscriber.count({ where: { isActive: true } }),
    ]);

    return {
      data: subscribers,
      meta: { page: p, limit: l, total, totalPages: Math.ceil(total / l) },
    };
  }
}
