import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Customer } from './customer.entity';import { Invoice } from './invoice.entity';import { QuotationItem } from './quotation-item.entity';import { User } from './user.entity';
export type QuotationStatus='DRAFT'|'SENT'|'APPROVED'|'REJECTED'|'EXPIRED';
@Entity('Quotation')
export class Quotation {
 @PrimaryGeneratedColumn() id:number; @Column() customerId:number; @Column() userId:number;
 @Column({type:'text',unique:true}) quotationNumber:string;
 @Column({type:'timestamp',default:()=> 'CURRENT_TIMESTAMP'}) quotationDate:Date;
 @Column({type:'text',nullable:true}) description:string|null;
 @ManyToOne(()=>Customer,c=>c.quotations,{onDelete:'RESTRICT'}) @JoinColumn({name:'customerId'}) customer:Customer;
 @ManyToOne(()=>User,u=>u.quotations,{onDelete:'RESTRICT'}) @JoinColumn({name:'userId'}) user:User;
 @OneToMany(()=>QuotationItem,i=>i.quotation,{cascade:true}) items:QuotationItem[];
 @Column({type:'double precision',default:0}) subtotal:number; @Column({type:'double precision',default:0}) discount:number;
 @Column({type:'double precision',default:0}) tax:number; @Column({type:'double precision',default:0}) totalAmount:number;
 @Column({type:'text',default:'DRAFT'}) status:QuotationStatus;
 @Column({type:'timestamp',nullable:true}) validUntil:Date|null; @CreateDateColumn() createdAt:Date;
 @Column({nullable:true}) invoiceId:number|null;
 @ManyToOne(()=>Invoice,{nullable:true,onDelete:'SET NULL'}) @JoinColumn({name:'invoiceId'}) invoice:Invoice|null;
 @Column({type:'timestamp',nullable:true}) convertedAt:Date|null;
}
