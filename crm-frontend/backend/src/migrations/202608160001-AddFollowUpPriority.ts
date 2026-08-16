import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFollowUpPriority1786842060000 implements MigrationInterface {
  name = 'AddFollowUpPriority1786842060000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "FollowUp" ADD COLUMN IF NOT EXISTS "priority" text NOT NULL DEFAULT 'MEDIUM'`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_FollowUp_due_status" ON "FollowUp" ("dueDate", "status")`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_FollowUp_due_status"`);
    await queryRunner.query(`ALTER TABLE "FollowUp" DROP COLUMN IF EXISTS "priority"`);
  }
}
