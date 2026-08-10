import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { SalesService } from './sales.service';

@Controller('sales')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('ADMIN', 'SALES')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@Body() body: any, @Req() req: any) {
    return this.salesService.create(body, req.user);
  }

  @Post('reports/preview')
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  previewReport(
    @UploadedFile() file: Express.Multer.File,
    @Body('reportType') reportType: string,
    @Body('mapping') mapping?: string,
  ) {
    return this.salesService.previewReport(file, reportType, mapping);
  }

  @Post('reports/import')
  @Roles('ADMIN')
  importReport(@Body() body: any, @Req() req: any) {
    return this.salesService.importReport(body, req.user.id);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.salesService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.salesService.findOne(Number(id), req.user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.salesService.update(Number(id), body, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.salesService.remove(Number(id), req.user);
  }
}
