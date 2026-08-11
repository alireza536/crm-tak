import 'dotenv/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { InvoiceModule } from './invoice/invoice.module';
import { UserModule } from './user.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DashboardModule as InvoiceDashboardModule } from './invoice/dashboard/dashboard.module';
import { SalesModule } from './sales/sales.module';
import { FollowupsModule } from './followups/followups.module';
import { QuotationModule } from './quotation/quotation.module';
import { PaymentsModule } from './payments/payments.module';
import { Customer, CustomerHistory, CustomerImport, FollowUp, Invoice, Payment, Quotation, QuotationItem, Sale, SalesReportImport, User } from './entities';
import { AddUserAuthenticationColumns1786410060000 } from './migrations/202608110001-AddUserAuthenticationColumns';
@Module({
  imports:[
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, Customer, CustomerHistory, CustomerImport, FollowUp, Sale, SalesReportImport, Invoice, Payment, Quotation, QuotationItem],
      migrations: [AddUserAuthenticationColumns1786410060000],
      migrationsRun: true,
      synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
    }),
    AuthModule,
    CustomersModule,
    InvoiceModule,
    SalesModule,
    FollowupsModule,
    QuotationModule,
    PaymentsModule,
    UserModule,
    DashboardModule,
    InvoiceDashboardModule,
  ],
})
export class AppModule {}
