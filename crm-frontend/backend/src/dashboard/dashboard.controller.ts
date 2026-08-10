import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RoleGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin')
  @Roles('ADMIN')
  getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }

  @Get('sales')
  @Roles('SALES')
  getSalesDashboard(@Req() req: any) {
    return this.dashboardService.getSalesDashboard(req.user.id);
  }
}
