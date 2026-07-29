import { Controller, Get, Post, Delete, Body, Query, Param, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { NewsletterService } from './newsletter.service';
import { SubscribeDto, ContactDto } from './newsletter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller()
export class NewsletterController {
  constructor(private newsletterService: NewsletterService) {}

  @Post('newsletter/subscribe')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async subscribe(@Body() dto: SubscribeDto) {
    return this.newsletterService.subscribe(dto.email);
  }

  @Post('newsletter/unsubscribe')
  async unsubscribe(@Body() dto: SubscribeDto) {
    return this.newsletterService.unsubscribe(dto.email);
  }

  @Post('contact')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async contact(@Body() dto: ContactDto) {
    return this.newsletterService.submitContact(dto);
  }

  @Get('admin/newsletter/subscribers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getSubscribers(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.newsletterService.getSubscribers(page, limit);
  }

  @Delete('admin/subscribers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteSubscriber(@Param('id') id: string) {
    return this.newsletterService.deleteSubscriber(id);
  }
}
