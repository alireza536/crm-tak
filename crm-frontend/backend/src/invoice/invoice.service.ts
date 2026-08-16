import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { CustomerHistory } from '../entities/customer-history.entity';
import { Invoice } from '../entities/invoice.entity';
import { User } from '../entities/user.entity';

type AuthenticatedUser = { id: number; role: string };
const INVOICE_STATUSES = ['PENDING', 'PAID', 'CANCELLED'] as const;

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice) private readonly invoices: Repository<Invoice>,
    private readonly dataSource: DataSource,
  ) {}

  async getAll(actor: AuthenticatedUser) {
    const invoices = await this.invoices.find({
      where: actor.role === 'ADMIN' ? {} : { customer: { salespersonId: actor.id } },
      relations: { user: true, customer: true },
      order: { createdAt: 'DESC' },
    });
    return invoices.map((invoice) => this.toResponse(invoice));
  }

  async findOne(id: number, actor: AuthenticatedUser) {
    const invoice = await this.invoices.findOne({
      where: actor.role === 'ADMIN' ? { id } : { id, customer: { salespersonId: actor.id } },
      relations: { user: true, customer: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return this.toResponse(invoice);
  }

  generate(data: any, actor: AuthenticatedUser) {
    return this.dataSource.transaction(async (manager) => {
      const customerId = this.requiredId(data.customerId, 'customerId');
      const userId = actor.role === 'SALES' ? actor.id : this.requiredId(data.userId, 'userId');
      const items = this.validItems(data.items);
      const total = data.total === undefined && items ? items.reduce((sum, item) => sum + item.totalPrice, 0) : Number(data.total);
      if (!Number.isFinite(total) || total <= 0) throw new BadRequestException('total must be greater than zero');
      const status = this.validStatus(data.status ?? 'PENDING');

      const customer = await manager.getRepository(Customer).findOneBy({ id: customerId });
      if (!customer) throw new BadRequestException('Customer not found');
      const salesperson = await manager.getRepository(User).findOneBy({ id: userId, role: 'SALES' });
      if (!salesperson) throw new BadRequestException('userId must reference a SALES user');
      if (actor.role === 'SALES' && customer.salespersonId !== actor.id) {
        throw new BadRequestException('Sales users can only invoice their own customers');
      }

      const invoice = await manager.getRepository(Invoice).save({
        customerId,
        userId,
        invoiceNumber: this.generateInvoiceNumber(),
        total,
        items,
        status,
      });
      await manager.getRepository(CustomerHistory).save({
        customerId,
        userId: actor.id,
        action: 'INVOICE',
        description: `Invoice ${invoice.invoiceNumber} generated for ${invoice.total}`,
      });
      return this.findByIdForResponse(invoice.id, manager);
    });
  }

  update(id: number, data: any, actor: AuthenticatedUser) {
    return this.dataSource.transaction(async manager => {
      const repository = manager.getRepository(Invoice);
      const invoice = await repository.findOne({ where: this.accessibleWhere(id, actor), relations: { customer: true, user: true } });
      if (!invoice) throw new NotFoundException('Invoice not found');
      if (data.customerId !== undefined) {
        const customerId = this.requiredId(data.customerId, 'customerId');
        const customer = await manager.getRepository(Customer).findOneBy(actor.role === 'ADMIN' ? { id: customerId } : { id: customerId, salespersonId: actor.id });
        if (!customer) throw new BadRequestException('Customer not found or not accessible');
        invoice.customerId = customerId;
      }
      if (data.userId !== undefined && actor.role === 'ADMIN') {
        const userId = this.requiredId(data.userId, 'userId');
        if (!await manager.getRepository(User).exist({ where: { id: userId, role: 'SALES' } })) throw new BadRequestException('userId must reference a SALES user');
        invoice.userId = userId;
      }
      if (data.invoiceNumber !== undefined) {
        const number = String(data.invoiceNumber).trim(); if (!number) throw new BadRequestException('invoiceNumber is required');
        const duplicate = await repository.createQueryBuilder('invoice').where('invoice.invoiceNumber = :number AND invoice.id != :id', { number, id }).getOne();
        if (duplicate) throw new BadRequestException('invoiceNumber already exists'); invoice.invoiceNumber = number;
      }
      if (data.items !== undefined) invoice.items = this.validItems(data.items);
      if (data.total !== undefined) { const total = Number(data.total); if (!Number.isFinite(total) || total <= 0) throw new BadRequestException('total must be greater than zero'); invoice.total = total; }
      else if (data.items !== undefined) invoice.total = invoice.items!.reduce((sum, item) => sum + item.totalPrice, 0);
      if (data.status !== undefined) invoice.status = this.validStatus(data.status);
      await repository.save(invoice);
      await manager.getRepository(CustomerHistory).save({ customerId: invoice.customerId, userId: actor.id, action: 'INVOICE_UPDATED', description: `Invoice ${invoice.invoiceNumber} updated` });
      return this.findByIdForResponse(id, manager);
    });
  }

  async remove(id: number, actor: AuthenticatedUser) {
    const invoice = await this.invoices.findOne({ where: this.accessibleWhere(id, actor), relations: { customer: true } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status === 'PAID') throw new BadRequestException('Paid invoice cannot be deleted');
    await this.invoices.remove(invoice); return { deleted: true, id };
  }

  updateStatus(id: number, statusValue: unknown, actor: AuthenticatedUser) {
    return this.dataSource.transaction(async (manager) => {
      const status = this.validStatus(statusValue);
      const repository = manager.getRepository(Invoice);
      const invoice = await repository.findOne({ where: this.accessibleWhere(id, actor), relations: { customer: true } });
      if (!invoice) throw new NotFoundException('Invoice not found');
      invoice.status = status;
      await repository.save(invoice);
      return this.findByIdForResponse(invoice.id, manager);
    });
  }

  private validStatus(value: unknown) {
    if (typeof value !== 'string' || !INVOICE_STATUSES.includes(value as any)) {
      throw new BadRequestException(`status must be one of: ${INVOICE_STATUSES.join(', ')}`);
    }
    return value;
  }

  private accessibleWhere(id: number, actor: AuthenticatedUser) {
    return actor.role === 'ADMIN' ? { id } : { id, customer: { salespersonId: actor.id } };
  }

  private validItems(value: unknown) {
    if (value === undefined || value === null) return null;
    if (!Array.isArray(value)) throw new BadRequestException('items must be an array');
    return value.map((raw: any, index: number) => {
      const productName = String(raw.productName || '').trim(), productCode = String(raw.productCode || '').trim() || null, quantity = Number(raw.quantity), unitPrice = Number(raw.unitPrice), discount = Number(raw.discount || 0);
      if (!productName || !Number.isInteger(quantity) || quantity < 1 || !Number.isFinite(unitPrice) || unitPrice < 0 || !Number.isFinite(discount) || discount < 0 || discount > quantity * unitPrice) throw new BadRequestException(`Invalid invoice item at row ${index + 1}`);
      return { productName, productCode, quantity, unitPrice, discount, totalPrice: quantity * unitPrice - discount };
    });
  }

  private requiredId(value: unknown, field: string) {
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1) throw new BadRequestException(`${field} must be a positive integer`);
    return id;
  }

  private generateInvoiceNumber() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `INV-${date}-${randomBytes(5).toString('hex').toUpperCase()}`;
  }

  private async findByIdForResponse(id: number, manager: EntityManager) {
    const invoice = await manager.getRepository(Invoice).findOne({
      where: { id },
      relations: { customer: true, user: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return this.toResponse(invoice);
  }

  private toResponse(invoice: Invoice) {
    return {
      ...invoice,
      user: invoice.user ? { id: invoice.user.id, name: invoice.user.name, phone: invoice.user.phone, role: invoice.user.role } : null,
      factor: invoice.invoiceNumber,
      sale: invoice.total,
      date: invoice.invoiceDate ?? invoice.createdAt,
      amount: invoice.total,
      discount: 0,
    };
  }
}
