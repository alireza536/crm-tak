import { MigrationInterface, QueryRunner } from 'typeorm';

export class CustomerInvoiceArchitecture1786320060000 implements MigrationInterface {
  name = 'CustomerInvoiceArchitecture1786320060000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Customer' AND column_name = 'assignedToId')
          AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Customer' AND column_name = 'salespersonId') THEN
          ALTER TABLE "Customer" RENAME COLUMN "assignedToId" TO "salespersonId";
        END IF;
      END $$
    `);
    await queryRunner.query(`ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "nationalCode" text`);
    await queryRunner.query(`ALTER TABLE "Customer" ALTER COLUMN "phone" DROP NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_Customer_nationalCode" ON "Customer" ("nationalCode") WHERE "nationalCode" IS NOT NULL`);
    await queryRunner.query(`ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "invoiceDate" timestamp`);
    await queryRunner.query(`ALTER TABLE "Invoice" ALTER COLUMN "userId" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "Sale" ALTER COLUMN "userId" DROP NOT NULL`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_Customer_nationalCode"`);
    await queryRunner.query(`ALTER TABLE "Customer" DROP COLUMN IF EXISTS "nationalCode"`);
    await queryRunner.query(`ALTER TABLE "Invoice" DROP COLUMN IF EXISTS "invoiceDate"`);
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Customer' AND column_name = 'salespersonId')
          AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Customer' AND column_name = 'assignedToId') THEN
          ALTER TABLE "Customer" RENAME COLUMN "salespersonId" TO "assignedToId";
        END IF;
      END $$
    `);
  }
}
