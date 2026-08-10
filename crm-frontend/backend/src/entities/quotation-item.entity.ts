import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Quotation } from './quotation.entity';
@Entity('QuotationItem')
export class QuotationItem {
 @PrimaryGeneratedColumn() id:number;
 @Column() quotationId:number;
 @ManyToOne(()=>Quotation,q=>q.items,{onDelete:'CASCADE'}) @JoinColumn({name:'quotationId'}) quotation:Quotation;
 @Column({type:'text'}) productName:string;
 @Column({type:'int'}) quantity:number;
 @Column({type:'double precision'}) unitPrice:number;
 @Column({type:'double precision',default:0}) discount:number;
 @Column({type:'double precision'}) totalPrice:number;
}
