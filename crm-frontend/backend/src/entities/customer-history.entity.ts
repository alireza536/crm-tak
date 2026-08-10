import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Customer } from './customer.entity';
import { User } from './user.entity';

@Entity('CustomerHistory')
export class CustomerHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  customerId: number | null;

  @Column({ nullable: true })
  userId: number | null;

  @ManyToOne(() => Customer, (customer) => customer.history, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer | null;

  @ManyToOne(() => User, (user) => user.history, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Column({ type: 'text' })
  action: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
