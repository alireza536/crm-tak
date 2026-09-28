import { MigrationInterface, QueryRunner } from 'typeorm';

export class CampaignSmsDelivery1786845660002 implements MigrationInterface {
  name = 'CampaignSmsDelivery1786845660002';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "smsMarketingOptIn" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "smsMarketingConsentAt" timestamptz NULL`);
    await queryRunner.query(`ALTER TABLE "SmsCampaign" ADD COLUMN IF NOT EXISTS "skippedCount" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "SmsCampaignRecipient" (
      "id" SERIAL PRIMARY KEY,
      "campaignId" integer NOT NULL REFERENCES "SmsCampaign"("id") ON DELETE CASCADE,
      "customerId" integer NOT NULL REFERENCES "Customer"("id") ON DELETE CASCADE,
      "phone" text NOT NULL,
      "status" text NOT NULL DEFAULT 'QUEUED',
      "providerMessageId" text NULL,
      "error" text NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      "updatedAt" timestamptz NOT NULL DEFAULT now(),
      "sentAt" timestamptz NULL,
      CONSTRAINT "UQ_SmsCampaignRecipient_campaign_customer" UNIQUE ("campaignId", "customerId"),
      CONSTRAINT "CHK_SmsCampaignRecipient_status" CHECK ("status" IN ('QUEUED','SENDING','SENT','FAILED','SKIPPED'))
    )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_SmsCampaignRecipient_queue" ON "SmsCampaignRecipient" ("status", "id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_Customer_smsMarketingOptIn" ON "Customer" ("id") WHERE "smsMarketingOptIn" = true`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_Customer_smsMarketingOptIn"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_SmsCampaignRecipient_queue"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "SmsCampaignRecipient"`);
    await queryRunner.query(`ALTER TABLE "SmsCampaign" DROP COLUMN IF EXISTS "skippedCount"`);
    await queryRunner.query(`ALTER TABLE "Customer" DROP COLUMN IF EXISTS "smsMarketingConsentAt"`);
    await queryRunner.query(`ALTER TABLE "Customer" DROP COLUMN IF EXISTS "smsMarketingOptIn"`);
  }
}
