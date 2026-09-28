import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { IntelligenceService } from './intelligence.service';

@Controller('intelligence')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('ADMIN', 'SALES')
export class IntelligenceController {
  constructor(private readonly service: IntelligenceService) {}
  @Get('customers') customers(@Query() filters: any, @Req() req: any) { return this.service.filterCustomers(filters, req.user); }
  @Get('customers/:id/insights') insights(@Param('id') id: string, @Req() req: any) { return this.service.customerInsight(Number(id), req.user); }
  @Get('churn') churn(@Query() filters: any, @Req() req: any) { return this.service.churn(filters, req.user); }
  @Get('recommendations') recommendations(@Req() req: any) { return this.service.recommendations(req.user); }
  @Get('dashboard') dashboard(@Req() req: any) { return this.service.dashboard(req.user); }
  @Post('query') query(@Body() body: any, @Req() req: any) { return this.service.safeQuery(body, req.user); }
}
