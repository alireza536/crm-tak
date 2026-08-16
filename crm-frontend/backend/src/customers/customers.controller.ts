import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { excelUploadOptions } from '../uploads/excel-upload-options';

@Controller('customers')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('ADMIN', 'SALES')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(@Body() body: any, @Req() req: any) {
    return this.customersService.create(body, req.user);
  }

  @Post('import/preview')
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('file', excelUploadOptions))
  previewImport(@UploadedFile() file: Express.Multer.File) {
    return this.customersService.previewImport(file);
  }

  @Post('import')
  @Roles('ADMIN')
  importCustomers(@Body() body: any, @Req() req: any) {
    return this.customersService.importCustomers(body, req.user.id);
  }

  @Get('import/history')
  @Roles('ADMIN')
  importHistory() {
    return this.customersService.getImportHistory();
  }

  @Get()
  findAll(@Req() req: any) {
    return this.customersService.findAll(req.user);
  }

  @Get('statistics')
  @Roles('ADMIN')
  getCustomerStatistics() {
    return this.customersService.getCustomerStatistics();
  }

  @Get('free')
  getFreeCustomers() {
    return this.customersService.getFreeCustomers();
  }

  @Patch(':id/claim')
  @Roles('SALES')
  claim(@Param('id') id: string, @Req() req: any) {
    return this.customersService.claim(Number(id), req.user.id);
  }

  @Get('my')
  getMyCustomers(@Req() req: any) {
    return this.customersService.getMyCustomers(req.user.id);
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string, @Req() req: any) {
    return this.customersService.getHistory(Number(id), req.user);
  }

  @Post(':id/notes')
  addNote(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.customersService.addNote(Number(id), body, req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.customersService.findOne(Number(id), req.user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.customersService.update(Number(id), body, req.user);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.customersService.remove(Number(id), req.user.id);
  }

  @Patch(':id/assign')
  @Roles('ADMIN')
  assign(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.customersService.assign(Number(id), Number(body.userId), req.user.id);
  }

  @Patch(':id/release')
  @Roles('ADMIN')
  release(@Param('id') id: string, @Req() req: any) {
    return this.customersService.release(Number(id), req.user.id);
  }
}
