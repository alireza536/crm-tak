import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Customer, CustomerHistory, CustomerImport, FollowUp, Invoice, Payment, Quotation, QuotationItem, Sale, SalesCommission, SalesReportImport, User } from './entities';
import { InitialProductionSchema1786233660000 } from './migrations/202608090001-InitialProductionSchema';
import { CustomerInvoiceArchitecture1786320060000 } from './migrations/202608100001-CustomerInvoiceArchitecture';
import { NullableCustomerPhone1786323660000 } from './migrations/202608100002-NullableCustomerPhone';
import { CustomerOwnershipStatus1786327260000 } from './migrations/202608100003-CustomerOwnershipStatus';
import { AddUserAuthenticationColumns1786410060000 } from './migrations/202608110001-AddUserAuthenticationColumns';
import { RepairUserAuthenticationSchema1786755660000 } from './migrations/202608150001-RepairUserAuthenticationSchema';
import { EnsureUserProfileColumns1786759260000 } from './migrations/202608150002-EnsureUserProfileColumns';
import { RepairCrmOperationalSchema1786762860000 } from './migrations/202608150003-RepairCrmOperationalSchema';
import { AddFollowUpPriority1786842060000 } from './migrations/202608160001-AddFollowUpPriority';
import { CreateSalesCommission1786845660000 } from './migrations/202608160002-CreateSalesCommission';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Customer, CustomerHistory, CustomerImport, FollowUp, Sale, SalesReportImport, Invoice, Payment, Quotation, QuotationItem, SalesCommission],
  migrations: [InitialProductionSchema1786233660000, CustomerInvoiceArchitecture1786320060000, NullableCustomerPhone1786323660000, CustomerOwnershipStatus1786327260000, AddUserAuthenticationColumns1786410060000, RepairUserAuthenticationSchema1786755660000, EnsureUserProfileColumns1786759260000, RepairCrmOperationalSchema1786762860000, AddFollowUpPriority1786842060000, CreateSalesCommission1786845660000],
  synchronize: false,
  ssl: process.env.DATABASE_SSL === 'true'
    ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' }
    : undefined,
  extra: {
    max: Number(process.env.DB_POOL_MAX || 10),
    connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 10000),
    idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
  },
});
