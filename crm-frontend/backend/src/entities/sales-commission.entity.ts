import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('SalesCommission')
export class SalesCommission {
  @PrimaryGeneratedColumn() id: number;
  @Column({ unique: true }) userId: number;
  @OneToOne(() => User, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'userId' }) user: User;
  @Column({ type: 'double precision', default: 0 }) percentage: number;
  @Column({ type: 'double precision', default: 0 }) paidAmount: number;
  @UpdateDateColumn() updatedAt: Date;
}
