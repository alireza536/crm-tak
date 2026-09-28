import { MigrationInterface, QueryRunner } from 'typeorm';

export class CustomerIntelligence1786845660001 implements MigrationInterface {
  name = 'CustomerIntelligence1786845660001';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "dateOfBirth" date`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_Invoice_customer_date" ON "Invoice" ("customerId", "invoiceDate")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_Sale_customer_date" ON "Sale" ("customerId", "saleDate")`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "SmsCampaign" ("id" SERIAL PRIMARY KEY,"name" text NOT NULL,"message" text NOT NULL,"filters" jsonb NOT NULL DEFAULT '{}'::jsonb,"status" text NOT NULL DEFAULT 'DRAFT',"scheduledAt" timestamp NULL,"sentAt" timestamp NULL,"recipientCount" integer NOT NULL DEFAULT 0,"sentCount" integer NOT NULL DEFAULT 0,"failedCount" integer NOT NULL DEFAULT 0,"createdBy" integer NULL,"createdAt" timestamp NOT NULL DEFAULT now(),"updatedAt" timestamp NOT NULL DEFAULT now())`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "SmsTemplate" ("id" SERIAL PRIMARY KEY,"name" text NOT NULL,"message" text NOT NULL,"createdAt" timestamp NOT NULL DEFAULT now(),"updatedAt" timestamp NOT NULL DEFAULT now())`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "AutomationRule" ("id" SERIAL PRIMARY KEY,"name" text NOT NULL,"type" text NOT NULL,"enabled" boolean NOT NULL DEFAULT false,"delayDays" integer NOT NULL DEFAULT 30,"cooldownDays" integer NOT NULL DEFAULT 30,"message" text NOT NULL,"targetFilters" jsonb NOT NULL DEFAULT '{}'::jsonb,"updatedAt" timestamp NOT NULL DEFAULT now(),CONSTRAINT "CHK_AutomationRule_days" CHECK ("delayDays" >= 0 AND "cooldownDays" >= 0))`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "AutomationExecution" ("id" SERIAL PRIMARY KEY,"ruleId" integer NOT NULL,"customerId" integer NOT NULL,"periodKey" text NOT NULL,"status" text NOT NULL DEFAULT 'PREPARED',"reason" text NULL,"executedAt" timestamp NOT NULL DEFAULT now(),CONSTRAINT "UQ_AutomationExecution_once" UNIQUE ("ruleId","customerId","periodKey"),CONSTRAINT "FK_AutomationExecution_rule" FOREIGN KEY ("ruleId") REFERENCES "AutomationRule"("id") ON DELETE CASCADE,CONSTRAINT "FK_AutomationExecution_customer" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE)`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "AutomationExecution"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "AutomationRule"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "SmsTemplate"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "SmsCampaign"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_Sale_customer_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_Invoice_customer_date"`);
    await queryRunner.query(`ALTER TABLE "Customer" DROP COLUMN IF EXISTS "dateOfBirth"`);
  }
}
