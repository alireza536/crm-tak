import { MigrationInterface, QueryRunner } from 'typeorm';

export class CustomerOwnershipStatus1786327260000 implements MigrationInterface {
  name = 'CustomerOwnershipStatus1786327260000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Customer" ALTER COLUMN "status" SET DEFAULT 'FREE'`);
    await queryRunner.query(`UPDATE "Customer" SET "status" = CASE WHEN "salespersonId" IS NULL THEN 'FREE' ELSE 'ASSIGNED' END`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Customer" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'`);
    await queryRunner.query(`UPDATE "Customer" SET "status" = 'ACTIVE'`);
  }
}
