import { Module } from "@nestjs/common";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from '../../entities/invoice.entity';
import { Customer } from '../../entities/customer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, Customer])],
  controllers: [DashboardController],
  providers: [
    DashboardService,

  ],
})
export class DashboardModule {}
