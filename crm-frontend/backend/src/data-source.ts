import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Customer, CustomerHistory, CustomerImport, FollowUp, Invoice, Payment, Quotation, QuotationItem, Sale, SalesReportImport, User } from './entities';
import { CustomerInvoiceArchitecture1786320060000 } from './migrations/202608100001-CustomerInvoiceArchitecture';
import { NullableCustomerPhone1786323660000 } from './migrations/202608100002-NullableCustomerPhone';
import { CustomerOwnershipStatus1786327260000 } from './migrations/202608100003-CustomerOwnershipStatus';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Customer, CustomerHistory, CustomerImport, FollowUp, Sale, SalesReportImport, Invoice, Payment, Quotation, QuotationItem],
  migrations: [CustomerInvoiceArchitecture1786320060000, NullableCustomerPhone1786323660000, CustomerOwnershipStatus1786327260000],
  synchronize: false,
});
