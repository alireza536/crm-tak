import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureUserProfileColumns1786759260000 implements MigrationInterface {
  name = 'EnsureUserProfileColumns1786759260000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "address" TEXT`);
    await queryRunner.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "personCode" TEXT`);
  }

  async down(): Promise<void> {
    // Existing profile data must not be removed during rollback.
  }
}
