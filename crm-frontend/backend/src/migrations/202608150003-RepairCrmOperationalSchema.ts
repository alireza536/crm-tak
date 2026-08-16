import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Repairs columns introduced while the production database was already live.
 * Every statement is idempotent so interrupted Render deploys can retry safely.
 */
export class RepairCrmOperationalSchema1786762860000 implements MigrationInterface {
  name = 'RepairCrmOperationalSchema1786762860000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'Customer' AND column_name = 'assignedToId'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'Customer' AND column_name = 'salespersonId'
        ) THEN
          ALTER TABLE "Customer" RENAME COLUMN "assignedToId" TO "salespersonId";
        END IF;
      END $$
    `);

    await queryRunner.query(`ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "storeName" text`);
    await queryRunner.query(`ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "province" text`);
    await queryRunner.query(`ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "city" text`);
    await queryRunner.query(`ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "address" text`);
    await queryRunner.query(`ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "nationalCode" text`);
    await queryRunner.query(`ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "description" text`);
    await queryRunner.query(`ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'FREE'`);
    await queryRunner.query(`ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "customerType" text NOT NULL DEFAULT 'NORMAL'`);
    await queryRunner.query(`ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "initialScore" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "healthScore" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "salespersonId" integer`);
    await queryRunner.query(`ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "createdAt" timestamp NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "Customer" ALTER COLUMN "phone" DROP NOT NULL`);
    await queryRunner.query(`UPDATE "Customer" SET "status" = CASE WHEN "salespersonId" IS NULL THEN 'FREE' ELSE 'ASSIGNED' END WHERE "status" IS NULL OR "status" IN ('ACTIVE', '')`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_Customer_nationalCode" ON "Customer" ("nationalCode") WHERE "nationalCode" IS NOT NULL`);

    await queryRunner.query(`ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "productCode" text`);
    await queryRunner.query(`ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "invoiceNumber" text`);
    await queryRunner.query(`ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "reportType" text`);
    await queryRunner.query(`ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "saleDate" timestamp`);
    await queryRunner.query(`ALTER TABLE "Sale" ALTER COLUMN "userId" DROP NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_Sale_invoiceNumber" ON "Sale" ("invoiceNumber") WHERE "invoiceNumber" IS NOT NULL`);

    await queryRunner.query(`ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "invoiceDate" timestamp`);
    await queryRunner.query(`ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "items" jsonb`);
    await queryRunner.query(`ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'PENDING'`);
    await queryRunner.query(`ALTER TABLE "Invoice" ALTER COLUMN "userId" DROP NOT NULL`);
  }

  async down(): Promise<void> {
    // This is a production repair migration. Removing these columns would destroy CRM data.
  }
}
