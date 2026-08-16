import { Body, Controller, Get, Post, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { SalesService } from './sales.service';
import { excelUploadOptions } from '../uploads/excel-upload-options';

@Controller('reports')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('ADMIN')
export class SalesReportController {
  constructor(private readonly salesService: SalesService) {}

  @Post('preview')
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('file', excelUploadOptions))
  preview(
    @UploadedFile() file: Express.Multer.File,
    @Body('reportType') reportType: string,
    @Body('mapping') mapping?: string,
  ) {
    return this.salesService.previewReport(file, reportType, mapping);
  }

  @Post('import')
  @Roles('ADMIN')
  importReport(@Body() body: any, @Req() req: any) {
    return this.salesService.importReport(body, req.user.id);
  }

  @Get('imports')
  @Roles('ADMIN')
  importHistory() {
    return this.salesService.getImportHistory();
  }

  @Get('sample')
  @Roles('ADMIN')
  sample(@Res() response: Response) {
    response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    response.setHeader('Content-Disposition', 'attachment; filename="TAK-CRM-sales-import-sample.xlsx"');
    response.send(this.salesService.createImportSample());
  }

  @Get('summary')
  summary(@Req() req: any, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string, @Query('salespersonId') salespersonId?: string, @Query('customerId') customerId?: string, @Query('product') product?: string) {
    return this.salesService.getReportSummary(req.user, startDate, endDate, salespersonId, customerId, product);
  }

  @Get('chart')
  chart(@Req() req: any, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string, @Query('salespersonId') salespersonId?: string, @Query('customerId') customerId?: string, @Query('product') product?: string) {
    return this.salesService.getReportCharts(req.user, startDate, endDate, salespersonId, customerId, product);
  }
}
