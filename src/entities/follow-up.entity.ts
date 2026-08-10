import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Customer } from './customer.entity';
import { User } from './user.entity';

export type FollowUpType = 'CALL'|'WHATSAPP'|'MEETING'|'QUOTE'|'PAYMENT'|'OTHER';
export type FollowUpStatus = 'PENDING'|'DONE'|'CANCELLED'|'OVERDUE';

@Entity('FollowUp')
export class FollowUp {
  @PrimaryGeneratedColumn() id: number;
  @Column() customerId: number;
  @Column() userId: number;
  @ManyToOne(() => Customer, customer => customer.followUps, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'customerId' }) customer: Customer;
  @ManyToOne(() => User, user => user.followUps, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'userId' }) user: User;
  @Column({ type: 'text', default: 'CALL' }) type: FollowUpType;
  @Column({ type: 'text', default: 'Customer follow-up' }) title: string;
  @Column({ type: 'text', nullable: true }) description: string | null;
  @Column({ type: 'text', default: 'PENDING' }) status: FollowUpStatus;
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }) dueDate: Date;
  @Column({ type: 'timestamp', nullable: true }) completedAt: Date | null;
  @CreateDateColumn() createdAt: Date;
}
