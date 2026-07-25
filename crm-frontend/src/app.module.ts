import { Module } from "@nestjs/common";

import { UserController } from "./user.controller";
import { UserService } from "./user.service";

import { SmsController } from "./sms.controller";
import { SmsService } from "./sms.service";
import { PrismaService } from './prisma.service';
import { SalesController } from "./uploads/sales.controller";
import { SalesService } from "./uploads/sales.service";
import { DashboardModule } from "./invoice/dashboard/dashboard.module";
import { ExcelController } from "./uploads/excel.controller";
import { InvoiceModule } from "./invoice/invoice.module";
import { PrismaModule } from "./prisma.module";


@Module({
imports: [

  PrismaModule,

  DashboardModule,

  InvoiceModule,

],

  controllers: [
    UserController,
    SmsController,
    SalesController,
    ExcelController,
  ],

  providers: [
    UserService,
    SmsService,
    SalesService,
    PrismaService, 
  ],
})
export class AppModule {}