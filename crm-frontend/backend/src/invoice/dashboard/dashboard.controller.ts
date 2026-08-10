import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RoleGuard } from '../../auth/role.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('ADMIN', 'SALES')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getDashboard(@Req() req: any) {
    return this.dashboardService.getDashboard(req.user);
  }

  @Get('sales-chart')
  getSalesChart(@Req() req: any) {
    return this.dashboardService.getMonthlySales(req.user);
  }
}
