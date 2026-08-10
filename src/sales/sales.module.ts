import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../entities/customer.entity';
import { CustomerHistory } from '../entities/customer-history.entity';
import { Sale } from '../entities/sale.entity';
import { SalesReportImport } from '../entities/sales-report-import.entity';
import { User } from '../entities/user.entity';
import { SalesController } from './sales.controller';
import { SalesReportController } from './sales-report.controller';
import { SalesService } from './sales.service';

@Module({
  imports: [TypeOrmModule.forFeature([Sale, SalesReportImport, Customer, User, CustomerHistory])],
  controllers: [SalesController, SalesReportController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
