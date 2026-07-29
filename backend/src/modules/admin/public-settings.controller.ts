import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service';

/** Public storefront settings (bank details, contact, homepage content). No auth. */
@Controller('settings')
export class PublicSettingsController {
  constructor(private adminService: AdminService) {}

  @Get()
  async getPublicSettings() {
    return this.adminService.getSettings();
  }
}
