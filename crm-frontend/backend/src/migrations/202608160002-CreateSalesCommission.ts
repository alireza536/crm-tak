import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSalesCommission1786845660000 implements MigrationInterface {
  name='CreateSalesCommission1786845660000';
  async up(queryRunner:QueryRunner):Promise<void>{
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "SalesCommission" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "percentage" double precision NOT NULL DEFAULT 0, "paidAmount" double precision NOT NULL DEFAULT 0, "updatedAt" timestamp NOT NULL DEFAULT now(), CONSTRAINT "UQ_SalesCommission_user" UNIQUE ("userId"), CONSTRAINT "PK_SalesCommission" PRIMARY KEY ("id"))`);
    await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='FK_SalesCommission_user') THEN ALTER TABLE "SalesCommission" ADD CONSTRAINT "FK_SalesCommission_user" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE; END IF; END $$`);
  }
  async down(queryRunner:QueryRunner):Promise<void>{await queryRunner.query(`DROP TABLE IF EXISTS "SalesCommission"`)}
}
