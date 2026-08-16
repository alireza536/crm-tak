import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { Invoice } from '../entities/invoice.entity';
import { Payment, PaymentStatus } from '../entities/payment.entity';

type Actor = { id: number; role: string };
const STATUSES: PaymentStatus[] = ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'];

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
    private readonly dataSource: DataSource,
  ) {}

  all(actor: Actor) {
    return this.paymentQuery(actor).orderBy('payment.paymentDate', 'DESC').getMany();
  }

  async byInvoice(invoiceId: number, actor: Actor) {
    await this.accessibleInvoice(invoiceId, actor);
    return this.paymentQuery(actor)
      .andWhere('payment.invoiceId = :invoiceId', { invoiceId })
      .orderBy('payment.paymentDate', 'DESC')
      .getMany();
  }

  create(data: any, actor: Actor) {
    return this.dataSource.transaction(async manager => {
      const invoice = await this.accessibleInvoice(this.id(data.invoiceId), actor, manager);
      const amount = this.amount(data.amount);
      const status = this.status(data.status || 'COMPLETED');
      const completed = (invoice.payments || [])
        .filter(payment => payment.status === 'COMPLETED')
        .reduce((sum, payment) => sum + Number(payment.amount), 0);
      if (status === 'COMPLETED' && completed + amount > invoice.total) {
        throw new BadRequestException('Payment exceeds invoice balance');
      }
      const payment = await manager.getRepository(Payment).save({
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        userId: actor.id,
        amount,
        paymentDate: this.date(data.paymentDate || new Date()),
        paymentMethod: String(data.paymentMethod || 'OTHER').trim(),
        description: String(data.description || '').trim() || null,
        status,
      });
      await this.syncInvoice(invoice.id, manager);
      return manager.getRepository(Payment).findOne({
        where: { id: payment.id },
        relations: { invoice: true, customer: true, user: true },
      });
    });
  }

  update(id: number, data: any, actor: Actor) {
    return this.dataSource.transaction(async manager => {
      const payment = await this.scopedPayment(manager.getRepository(Payment).createQueryBuilder('payment'), actor)
        .leftJoinAndSelect('payment.invoice', 'invoice')
        .andWhere('payment.id = :id', { id })
        .getOne();
      if (!payment) throw new NotFoundException('Payment not found');
      if (data.amount !== undefined) payment.amount = this.amount(data.amount);
      if (data.paymentDate !== undefined) payment.paymentDate = this.date(data.paymentDate);
      if (data.paymentMethod !== undefined) payment.paymentMethod = String(data.paymentMethod).trim();
      if (data.description !== undefined) payment.description = String(data.description || '').trim() || null;
      if (data.status !== undefined) payment.status = this.status(data.status);
      const others = await manager.getRepository(Payment).findBy({ invoiceId: payment.invoiceId, status: 'COMPLETED' });
      const total = others.filter(item => item.id !== id).reduce((sum, item) => sum + Number(item.amount), 0)
        + (payment.status === 'COMPLETED' ? Number(payment.amount) : 0);
      if (total > payment.invoice.total) throw new BadRequestException('Payment exceeds invoice balance');
      await manager.getRepository(Payment).save(payment);
      await this.syncInvoice(payment.invoiceId, manager);
      return payment;
    });
  }

  remove(id: number, actor: Actor) {
    return this.dataSource.transaction(async manager => {
      const payment = await this.scopedPayment(manager.getRepository(Payment).createQueryBuilder('payment'), actor)
        .andWhere('payment.id = :id', { id })
        .getOne();
      if (!payment) throw new NotFoundException('Payment not found');
      const invoiceId = payment.invoiceId;
      await manager.getRepository(Payment).remove(payment);
      await this.syncInvoice(invoiceId, manager);
      return { deleted: true, id };
    });
  }

  async summary(actor: Actor, start?: string, end?: string) {
    const invoices = await this.invoiceQuery(actor, start, end).getMany();
    const payments = await this.paymentRangeQuery(actor, start, end).getMany();
    const issued = invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
    const received = payments.filter(payment => payment.status === 'COMPLETED')
      .reduce((sum, payment) => sum + Number(payment.amount), 0);
    const allInvoices = await this.invoiceQuery(actor).leftJoinAndSelect('invoice.payments', 'allPayments').getMany();
    const debt = allInvoices.filter(invoice => invoice.status !== 'CANCELLED').reduce((sum, invoice) => {
      const paid = (invoice.payments || []).filter(payment => payment.status === 'COMPLETED')
        .reduce((paidSum, payment) => paidSum + Number(payment.amount), 0);
      return sum + Math.max(0, Number(invoice.total) - paid);
    }, 0);
    const now = new Date();
    const today = invoices.filter(invoice => new Date(invoice.invoiceDate || invoice.createdAt).toDateString() === now.toDateString())
      .reduce((sum, invoice) => sum + Number(invoice.total), 0);
    const month = invoices.filter(invoice => {
      const date = new Date(invoice.invoiceDate || invoice.createdAt);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).reduce((sum, invoice) => sum + Number(invoice.total), 0);
    const year = invoices.filter(invoice => new Date(invoice.invoiceDate || invoice.createdAt).getFullYear() === now.getFullYear())
      .reduce((sum, invoice) => sum + Number(invoice.total), 0);
    return { dailySales: today, monthlySales: month, yearlySales: year, totalInvoices: invoices.length, totalIssued: issued, totalPaid: received, totalDebt: debt };
  }

  async chart(actor: Actor, start?: string, end?: string) {
    const invoices = await this.invoiceQuery(actor, start, end).getMany();
    const map = new Map<string, { date: string; sales: number; invoices: number }>();
    for (const invoice of invoices) {
      const key = new Date(invoice.invoiceDate || invoice.createdAt).toISOString().slice(0, 10);
      const point = map.get(key) || { date: key, sales: 0, invoices: 0 };
      point.sales += Number(invoice.total);
      point.invoices++;
      map.set(key, point);
    }
    return [...map.values()].sort((left, right) => left.date.localeCompare(right.date));
  }

  private paymentQuery(actor: Actor) {
    return this.scopedPayment(this.payments.createQueryBuilder('payment'), actor)
      .leftJoinAndSelect('payment.invoice', 'invoice')
      .leftJoinAndSelect('payment.user', 'user');
  }

  private scopedPayment(query: SelectQueryBuilder<Payment>, actor: Actor) {
    query.leftJoinAndSelect('payment.customer', 'customer');
    if (actor.role !== 'ADMIN') query.andWhere('customer.salespersonId = :actorId', { actorId: actor.id });
    return query;
  }

  private async accessibleInvoice(id: number, actor: Actor, manager?: EntityManager) {
    const repository = (manager || this.dataSource.manager).getRepository(Invoice);
    const query = repository.createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.customer', 'customer')
      .leftJoinAndSelect('invoice.payments', 'payments')
      .where('invoice.id = :id', { id });
    if (actor.role !== 'ADMIN') query.andWhere('customer.salespersonId = :actorId', { actorId: actor.id });
    const invoice = await query.getOne();
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  private invoiceQuery(actor: Actor, start?: string, end?: string) {
    const query = this.dataSource.getRepository(Invoice).createQueryBuilder('invoice')
      .leftJoin('invoice.customer', 'customer');
    if (actor.role !== 'ADMIN') query.where('customer.salespersonId = :actorId', { actorId: actor.id });
    if (start) query.andWhere('COALESCE(invoice.invoiceDate, invoice.createdAt) >= :start', { start: new Date(`${start}T00:00:00`) });
    if (end) query.andWhere('COALESCE(invoice.invoiceDate, invoice.createdAt) <= :end', { end: new Date(`${end}T23:59:59.999`) });
    return query;
  }

  private paymentRangeQuery(actor: Actor, start?: string, end?: string) {
    const query = this.paymentQuery(actor);
    if (start) query.andWhere('payment.paymentDate >= :start', { start: new Date(`${start}T00:00:00`) });
    if (end) query.andWhere('payment.paymentDate <= :end', { end: new Date(`${end}T23:59:59.999`) });
    return query;
  }

  private async syncInvoice(id: number, manager: EntityManager) {
    const invoice = await manager.getRepository(Invoice).findOneBy({ id });
    if (!invoice) return;
    const paid = await manager.getRepository(Payment).findBy({ invoiceId: id, status: 'COMPLETED' });
    if (invoice.status !== 'CANCELLED') {
      invoice.status = paid.reduce((sum, payment) => sum + Number(payment.amount), 0) >= invoice.total ? 'PAID' : 'PENDING';
      await manager.getRepository(Invoice).save(invoice);
    }
  }

  private id(value: unknown) {
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1) throw new BadRequestException('invoiceId is invalid');
    return id;
  }

  private amount(value: unknown) {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('amount must be greater than zero');
    return amount;
  }

  private date(value: unknown) {
    const date = new Date(value as string | number | Date);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('paymentDate is invalid');
    return date;
  }

  private status(value: unknown) {
    if (!STATUSES.includes(value as PaymentStatus)) throw new BadRequestException('Invalid payment status');
    return value as PaymentStatus;
  }
}
