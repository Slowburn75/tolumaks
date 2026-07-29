import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('customers')
  async getCustomers(@Query() query: PaginationDto) {
    return this.adminService.getCustomers(query.page, query.limit, query.search);
  }

  @Get('customers/:id')
  async getCustomer(@Param('id') id: string) {
    return this.adminService.getCustomer(id);
  }

  @Get('analytics')
  async getAnalytics(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.adminService.getAnalytics(startDate, endDate);
  }

  @Get('settings')
  async getSettings() {
    return this.adminService.getSettings();
  }

  @Patch('settings')
  async updateSettings(@Body() settings: Record<string, unknown>) {
    return this.adminService.updateSettings(settings);
  }
}
