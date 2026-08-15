import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAuthenticationColumns1786410060000 implements MigrationInterface {
  name = 'AddUserAuthenticationColumns1786410060000';

  public async up(queryRunner: QueryRunner): Promise<void> {

    await queryRunner.query(`
      ALTER TABLE "User"
      ADD COLUMN IF NOT EXISTS "passwordHash" TEXT DEFAULT ''
    `);

    await queryRunner.query(`
      ALTER TABLE "User"
      ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'SALES'
    `);

    await queryRunner.query(`
      ALTER TABLE "User"
      ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT now()
    `);

  }

  public async down(queryRunner: QueryRunner): Promise<void> {

    await queryRunner.query(`
      ALTER TABLE "User"
      DROP COLUMN IF EXISTS "createdAt"
    `);

    await queryRunner.query(`
      ALTER TABLE "User"
      DROP COLUMN IF EXISTS "role"
    `);

    await queryRunner.query(`
      ALTER TABLE "User"
      DROP COLUMN IF EXISTS "passwordHash"
    `);

  }
}
