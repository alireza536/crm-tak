import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAuthenticationColumns1786410060000 implements MigrationInterface {
  name = 'AddUserAuthenticationColumns1786410060000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "address" TEXT,
        "personCode" TEXT,
        "passwordHash" TEXT NOT NULL DEFAULT '',
        "role" TEXT NOT NULL DEFAULT 'SALES',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "address" TEXT`);
    await queryRunner.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "personCode" TEXT`);
    await queryRunner.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'SALES'`);
    await queryRunner.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
    await queryRunner.query(`UPDATE "User" SET "name" = 'محبوبه حسین زاده', "role" = 'SALES', "passwordHash" = '$2b$10$kiLRkoLMQBPKKRlNrVwJNOBekrVBivuW0emxERIAxrf.CDXAorQe6' WHERE "phone" = '09155255645'`);
    await queryRunner.query(`UPDATE "User" SET "name" = 'امیر ابراهیم محمدی', "role" = 'SALES', "passwordHash" = '$2b$10$yabrwCwIOJHalUSTGYNax.C65gEHJb6iwFmjc6lv7hTnpCvpBHkhi' WHERE "phone" = '09058531174'`);
    await queryRunner.query(`UPDATE "User" SET "name" = 'علی بیسجردی', "role" = 'ADMIN', "passwordHash" = '$2b$10$v9Cl5lJUOKimQnOHPUdBZuXE0SJV6.F1cbV3sjWfJjCWZlphD/eLi' WHERE "phone" = '09156440664'`);
    await queryRunner.query(`UPDATE "User" SET "name" = 'علیرضا خورشیدی', "role" = 'ADMIN', "passwordHash" = '$2b$10$jqhzGUTixjjmZlwkp5qBdO9IPcxw0gK4X6e5natIJ2W3SDTL80f7u' WHERE "phone" = '09214430376'`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "User" DROP COLUMN IF EXISTS "createdAt"`);
    await queryRunner.query(`ALTER TABLE "User" DROP COLUMN IF EXISTS "role"`);
    await queryRunner.query(`ALTER TABLE "User" DROP COLUMN IF EXISTS "passwordHash"`);
  }
}
