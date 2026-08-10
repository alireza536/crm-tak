import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { InvoiceService } from './invoice.service';

@Controller(['invoice', 'invoices'])
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('ADMIN', 'SALES')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get()
  getInvoices(@Req() req: any) {
    return this.invoiceService.getAll(req.user);
  }

  @Post('generate')
  generate(@Body() body: any, @Req() req: any) {
    return this.invoiceService.generate(body, req.user);
  }

  @Post()
  create(@Body() body: any, @Req() req: any) {
    return this.invoiceService.generate(body, req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.invoiceService.findOne(Number(id), req.user);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.invoiceService.updateStatus(Number(id), body.status, req.user);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.invoiceService.update(Number(id), body, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.invoiceService.remove(Number(id), req.user);
  }
}
