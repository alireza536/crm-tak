import { Module } from "@nestjs/common";

import { UserController } from "./user.controller";
import { UserService } from "./user.service";

import { SmsController } from "./sms.controller";
import { SmsService } from "./sms.service";

import { SalesController } from "./uploads/sales.controller";
import { SalesService } from "./uploads/sales.service";

import { ExcelController } from "./uploads/excel.controller";

import { DashboardModule } from "./invoice/dashboard/dashboard.module";
import { InvoiceModule } from "./invoice/invoice.module";
import { PrismaModule } from "./prisma.module";

import { AuthModule } from "./auth/auth.module";


@Module({

imports: [

  PrismaModule,

  DashboardModule,

  InvoiceModule,

  AuthModule,

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

],

})

export class AppModule {}