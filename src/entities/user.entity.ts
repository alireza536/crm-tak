import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Customer } from './customer.entity';
import { CustomerHistory } from './customer-history.entity';
import { FollowUp } from './follow-up.entity';
import { Invoice } from './invoice.entity';
import { Sale } from './sale.entity';
import { Quotation } from './quotation.entity';

@Entity('User')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', unique: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'text', unique: true })
  personCode: string;

  @Column({ name: 'passwordHash', type: 'text' })
  password: string;

  @Column({ type: 'text', default: 'SALES' })
  role: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Customer, (customer) => customer.assignedTo)
  customers: Customer[];

  @OneToMany(() => CustomerHistory, (history) => history.user)
  history: CustomerHistory[];

  @OneToMany(() => FollowUp, (followUp) => followUp.user)
  followUps: FollowUp[];

  @OneToMany(() => Sale, (sale) => sale.user)
  sales: Sale[];

  @OneToMany(() => Invoice, (invoice) => invoice.user)
  invoices: Invoice[];

  @OneToMany(() => Quotation, (quotation) => quotation.user)
  quotations: Quotation[];
}
