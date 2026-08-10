import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Customer } from './customer.entity';
import { User } from './user.entity';
import { Payment } from './payment.entity';

@Entity('Invoice')
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  customerId: number;

  @Column({ nullable: true })
  userId: number | null;

  @ManyToOne(() => Customer, (customer) => customer.invoices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @ManyToOne(() => User, (user) => user.invoices, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Column({ type: 'text', unique: true })
  invoiceNumber: string;

  @Column({ type: 'double precision' })
  total: number;

  @Column({ type: 'timestamp', nullable: true })
  invoiceDate: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  items: Array<{ productName: string; productCode?: string | null; quantity: number; unitPrice: number; discount: number; totalPrice: number }> | null;

  @Column({ type: 'text', default: 'PENDING' })
  status: string;

  @OneToMany(() => Payment, (payment) => payment.invoice)
  payments: Payment[];

  @CreateDateColumn()
  createdAt: Date;
}
