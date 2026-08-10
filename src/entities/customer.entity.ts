import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CustomerHistory } from './customer-history.entity';
import { FollowUp } from './follow-up.entity';
import { Invoice } from './invoice.entity';
import { Sale } from './sale.entity';
import { User } from './user.entity';
import { Quotation } from './quotation.entity';
import { Payment } from './payment.entity';

@Entity('Customer')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  storeName: string | null;

  @Column({ type: 'text', unique: true, nullable: true })
  phone: string | null;

  @Column({ type: 'text', nullable: true })
  province: string | null;

  @Column({ type: 'text', nullable: true })
  city: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'text', nullable: true, unique: true })
  nationalCode: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', default: 'FREE' })
  status: string;

  @Column({ type: 'text', default: 'NORMAL' })
  customerType: string;

  @Column({ default: 0 })
  initialScore: number;

  @Column({ default: 0 })
  healthScore: number;

  @Column({ nullable: true })
  salespersonId: number | null;

  @ManyToOne(() => User, (user) => user.customers, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'salespersonId' })
  assignedTo: User | null;

  @OneToMany(() => CustomerHistory, (history) => history.customer)
  history: CustomerHistory[];

  @OneToMany(() => FollowUp, (followUp) => followUp.customer)
  followUps: FollowUp[];

  @OneToMany(() => Sale, (sale) => sale.customer)
  sales: Sale[];

  @OneToMany(() => Invoice, (invoice) => invoice.customer)
  invoices: Invoice[];

  @OneToMany(() => Quotation, (quotation) => quotation.customer)
  quotations: Quotation[];

  @OneToMany(() => Payment, (payment) => payment.customer)
  payments: Payment[];

  @CreateDateColumn()
  createdAt: Date;
}
