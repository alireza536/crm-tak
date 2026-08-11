import { MigrationInterface, QueryRunner } from 'typeorm';
import { AddUserAuthenticationColumns1786410060000 } from './202608110001-AddUserAuthenticationColumns';

export class RepairUserAuthenticationSchema1786755660000 implements MigrationInterface {
  name = 'RepairUserAuthenticationSchema1786755660000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await new AddUserAuthenticationColumns1786410060000().up(queryRunner);
  }

  async down(): Promise<void> {
    // This repair is intentionally non-destructive.
  }
}
