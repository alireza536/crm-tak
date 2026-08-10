import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Customer } from './customer.entity';
import { User } from './user.entity';

@Entity('Sale')
export class Sale {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  customerId: number;

  @Column({ nullable: true })
  userId: number | null;

  @ManyToOne(() => Customer, (customer) => customer.sales, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @ManyToOne(() => User, (user) => user.sales, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Column({ type: 'text' })
  productName: string;

  @Column({ type: 'text', nullable: true })
  productCode: string | null;

  @Column({ default: 1 })
  quantity: number;

  @Column({ type: 'double precision' })
  amount: number;

  @Column({ type: 'text', nullable: true, unique: true })
  invoiceNumber: string | null;

  @Column({ type: 'text', nullable: true })
  reportType: string | null;

  @Column({ type: 'timestamp', nullable: true })
  saleDate: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
