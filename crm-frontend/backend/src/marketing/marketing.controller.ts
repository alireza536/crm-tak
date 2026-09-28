import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { MarketingService } from './marketing.service';

@Controller('marketing')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('ADMIN')
export class MarketingController {
  constructor(private readonly service: MarketingService) {}
  @Get('delivery-status') deliveryStatus() { return this.service.deliveryStatus(); }
  @Get('campaigns') campaigns() { return this.service.campaigns(); }
  @Post('campaigns') createCampaign(@Body() body: any, @Req() req: any) { return this.service.createCampaign(body, req.user.id); }
  @Post('campaigns/:id/preview') preview(@Param('id') id: string) { return this.service.preview(Number(id)); }
  @Post('campaigns/:id/send') send(@Param('id') id: string, @Body() body: any) { return this.service.send(Number(id), body); }
  @Get('campaigns/:id/recipients') recipients(@Param('id') id: string) { return this.service.recipients(Number(id)); }
  @Get('templates') templates() { return this.service.templates(); }
  @Post('templates') createTemplate(@Body() body: any) { return this.service.createTemplate(body); }
  @Get('automations') automations() { return this.service.automations(); }
  @Post('automations') createAutomation(@Body() body: any) { return this.service.createAutomation(body); }
  @Patch('automations/:id') updateAutomation(@Param('id') id: string, @Body() body: any) { return this.service.updateAutomation(Number(id), body); }
  @Post('automations/:id/run') runAutomation(@Param('id') id: string) { return this.service.runAutomation(Number(id)); }
}
