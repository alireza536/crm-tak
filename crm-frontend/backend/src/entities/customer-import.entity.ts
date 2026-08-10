import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('CustomerImport')
export class CustomerImport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  userId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Column({ type: 'text' })
  fileName: string;

  @Column({ default: 0 })
  totalRows: number;

  @Column({ default: 0 })
  importedRows: number;

  @Column({ default: 0 })
  failedRows: number;

  @Column({ type: 'jsonb', nullable: true })
  errors: Array<{ row: number; message: string }> | null;

  @CreateDateColumn()
  createdAt: Date;
}
