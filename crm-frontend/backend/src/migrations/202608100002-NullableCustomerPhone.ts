import { MigrationInterface, QueryRunner } from 'typeorm';

export class NullableCustomerPhone1786323660000 implements MigrationInterface {
  name = 'NullableCustomerPhone1786323660000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Customer" ALTER COLUMN "phone" DROP NOT NULL`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "Customer" SET "phone" = 'AUTO-' || "id" WHERE "phone" IS NULL`);
    await queryRunner.query(`ALTER TABLE "Customer" ALTER COLUMN "phone" SET NOT NULL`);
  }
}
