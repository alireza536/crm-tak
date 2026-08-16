import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Non-destructive baseline for fresh PostgreSQL installations.
 * Existing deployments are left untouched because every table creation is guarded.
 */
export class InitialProductionSchema1786233660000 implements MigrationInterface {
  name = 'InitialProductionSchema1786233660000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "User" (
      "id" SERIAL PRIMARY KEY,
      "name" text NOT NULL,
      "phone" text NOT NULL UNIQUE,
      "address" text,
      "personCode" text NOT NULL UNIQUE,
      "passwordHash" text NOT NULL,
      "role" text NOT NULL DEFAULT 'SALES',
      "createdAt" timestamp NOT NULL DEFAULT now()
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "Customer" (
      "id" SERIAL PRIMARY KEY,
      "name" text NOT NULL,
      "storeName" text,
      "phone" text UNIQUE,
      "province" text,
      "city" text,
      "address" text,
      "nationalCode" text UNIQUE,
      "description" text,
      "status" text NOT NULL DEFAULT 'FREE',
      "customerType" text NOT NULL DEFAULT 'NORMAL',
      "initialScore" integer NOT NULL DEFAULT 0,
      "healthScore" integer NOT NULL DEFAULT 0,
      "salespersonId" integer REFERENCES "User"("id") ON DELETE SET NULL,
      "createdAt" timestamp NOT NULL DEFAULT now()
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "CustomerHistory" (
      "id" SERIAL PRIMARY KEY,
      "customerId" integer REFERENCES "Customer"("id") ON DELETE SET NULL,
      "userId" integer REFERENCES "User"("id") ON DELETE SET NULL,
      "action" text NOT NULL,
      "description" text,
      "createdAt" timestamp NOT NULL DEFAULT now()
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "CustomerImport" (
      "id" SERIAL PRIMARY KEY,
      "userId" integer REFERENCES "User"("id") ON DELETE SET NULL,
      "fileName" text NOT NULL,
      "totalRows" integer NOT NULL DEFAULT 0,
      "importedRows" integer NOT NULL DEFAULT 0,
      "failedRows" integer NOT NULL DEFAULT 0,
      "errors" jsonb,
      "createdAt" timestamp NOT NULL DEFAULT now()
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "Sale" (
      "id" SERIAL PRIMARY KEY,
      "customerId" integer NOT NULL REFERENCES "Customer"("id") ON DELETE CASCADE,
      "userId" integer REFERENCES "User"("id") ON DELETE SET NULL,
      "productName" text NOT NULL,
      "productCode" text,
      "quantity" integer NOT NULL DEFAULT 1,
      "amount" double precision NOT NULL,
      "invoiceNumber" text UNIQUE,
      "reportType" text,
      "saleDate" timestamp,
      "createdAt" timestamp NOT NULL DEFAULT now()
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "SalesReportImport" (
      "id" SERIAL PRIMARY KEY,
      "userId" integer REFERENCES "User"("id") ON DELETE SET NULL,
      "fileName" text NOT NULL,
      "reportType" text NOT NULL,
      "totalRows" integer NOT NULL DEFAULT 0,
      "importedRows" integer NOT NULL DEFAULT 0,
      "failedRows" integer NOT NULL DEFAULT 0,
      "errors" jsonb,
      "createdAt" timestamp NOT NULL DEFAULT now()
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "Invoice" (
      "id" SERIAL PRIMARY KEY,
      "customerId" integer NOT NULL REFERENCES "Customer"("id") ON DELETE CASCADE,
      "userId" integer REFERENCES "User"("id") ON DELETE SET NULL,
      "invoiceNumber" text NOT NULL UNIQUE,
      "total" double precision NOT NULL,
      "invoiceDate" timestamp,
      "items" jsonb,
      "status" text NOT NULL DEFAULT 'PENDING',
      "createdAt" timestamp NOT NULL DEFAULT now()
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "Payment" (
      "id" SERIAL PRIMARY KEY,
      "invoiceId" integer NOT NULL REFERENCES "Invoice"("id") ON DELETE CASCADE,
      "customerId" integer NOT NULL REFERENCES "Customer"("id") ON DELETE CASCADE,
      "userId" integer NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
      "amount" double precision NOT NULL,
      "paymentDate" timestamp NOT NULL,
      "paymentMethod" text NOT NULL,
      "description" text,
      "status" text NOT NULL DEFAULT 'COMPLETED',
      "createdAt" timestamp NOT NULL DEFAULT now()
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "Quotation" (
      "id" SERIAL PRIMARY KEY,
      "customerId" integer NOT NULL REFERENCES "Customer"("id") ON DELETE RESTRICT,
      "userId" integer NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
      "quotationNumber" text NOT NULL UNIQUE,
      "quotationDate" timestamp NOT NULL DEFAULT now(),
      "description" text,
      "subtotal" double precision NOT NULL DEFAULT 0,
      "discount" double precision NOT NULL DEFAULT 0,
      "tax" double precision NOT NULL DEFAULT 0,
      "totalAmount" double precision NOT NULL DEFAULT 0,
      "status" text NOT NULL DEFAULT 'DRAFT',
      "validUntil" timestamp,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      "invoiceId" integer REFERENCES "Invoice"("id") ON DELETE SET NULL,
      "convertedAt" timestamp
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "QuotationItem" (
      "id" SERIAL PRIMARY KEY,
      "quotationId" integer NOT NULL REFERENCES "Quotation"("id") ON DELETE CASCADE,
      "productName" text NOT NULL,
      "quantity" integer NOT NULL,
      "unitPrice" double precision NOT NULL,
      "discount" double precision NOT NULL DEFAULT 0,
      "totalPrice" double precision NOT NULL
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "FollowUp" (
      "id" SERIAL PRIMARY KEY,
      "customerId" integer NOT NULL REFERENCES "Customer"("id") ON DELETE CASCADE,
      "userId" integer NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "type" text NOT NULL DEFAULT 'CALL',
      "title" text NOT NULL DEFAULT 'Customer follow-up',
      "description" text,
      "status" text NOT NULL DEFAULT 'PENDING',
      "priority" text NOT NULL DEFAULT 'MEDIUM',
      "dueDate" timestamp NOT NULL DEFAULT now(),
      "completedAt" timestamp,
      "createdAt" timestamp NOT NULL DEFAULT now()
    )`);
  }

  async down(): Promise<void> {
    // Intentionally non-destructive: production rollback must never drop CRM data.
  }
}
