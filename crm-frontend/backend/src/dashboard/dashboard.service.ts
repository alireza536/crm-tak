import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { FollowUp } from '../entities/follow-up.entity';
import { Invoice } from '../entities/invoice.entity';
import { Payment } from '../entities/payment.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Customer) private readonly customers: Repository<Customer>,
    @InjectRepository(Invoice) private readonly invoices: Repository<Invoice>,
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
    @InjectRepository(FollowUp) private readonly followUps: Repository<FollowUp>,
  ) {}

  async getAdminDashboard() {
    const withoutFollowUpsQuery = this.customers.createQueryBuilder('customer')
      .leftJoin('customer.followUps', 'followUp')
      .where('followUp.id IS NULL');

    const [
      totalCustomers,
      freeCustomers,
      assignedCustomers,
      totalSales,
      totalPayments,
      revenueRow,
      salesPerformanceRows,
      recentInvoices,
      customersWithoutFollowUpsCount,
      customersWithoutFollowUps,
    ] = await Promise.all([
      this.customers.count(),
      this.customers.createQueryBuilder('customer')
        .where('customer.salespersonId IS NULL')
        .getCount(),
      this.customers.createQueryBuilder('customer')
        .where('customer.salespersonId IS NOT NULL')
        .getCount(),
      this.invoices.createQueryBuilder('invoice').where('invoice.status != :cancelled', { cancelled: 'CANCELLED' }).getCount(),
      this.payments.createQueryBuilder('payment')
        .where('payment.status = :completed', { completed: 'COMPLETED' })
        .getCount(),
      this.invoices.createQueryBuilder('invoice')
        .select('COALESCE(SUM(invoice.total), 0)', 'totalRevenue')
        .where('invoice.status != :cancelled', { cancelled: 'CANCELLED' })
        .getRawOne<{ totalRevenue: string }>(),
      this.invoices.createQueryBuilder('invoice')
        .innerJoin('invoice.customer', 'customer')
        .innerJoin('customer.assignedTo', 'salesperson')
        .where('invoice.status != :cancelled', { cancelled: 'CANCELLED' })
        .select('salesperson.id', 'userId')
        .addSelect('salesperson.name', 'name')
        .addSelect('COUNT(invoice.id)', 'salesCount')
        .addSelect('COALESCE(SUM(invoice.total), 0)', 'revenue')
        .groupBy('salesperson.id')
        .addGroupBy('salesperson.name')
        .orderBy('COALESCE(SUM(invoice.total), 0)', 'DESC')
        .getRawMany<{ userId: string; name: string; salesCount: string; revenue: string }>(),
      this.invoices.find({
        where: { status: 'PENDING' },
        relations: { customer: { assignedTo: true } },
        order: { createdAt: 'DESC' },
        take: 10,
      }),
      withoutFollowUpsQuery.clone().getCount(),
      withoutFollowUpsQuery.clone()
        .select(['customer.id', 'customer.name', 'customer.storeName', 'customer.phone', 'customer.status', 'customer.salespersonId', 'customer.createdAt'])
        .orderBy('customer.createdAt', 'DESC')
        .take(10)
        .getMany(),
    ]);

    const followUpSummary = await this.getFollowUpSummary();
    return {
      summary: {
        totalCustomers,
        freeCustomers,
        assignedCustomers,
        totalSales,
        totalInvoices: totalSales,
        totalPayments,
        totalRevenue: Number(revenueRow?.totalRevenue ?? 0),
        customersWithoutFollowUps: customersWithoutFollowUpsCount,
        bestSalesperson: salesPerformanceRows[0]?.name ?? null,
        ...followUpSummary,
      },
      salesPerformance: salesPerformanceRows.map(row => ({
        userId: Number(row.userId),
        name: row.name,
        salesCount: Number(row.salesCount),
        revenue: Number(row.revenue),
      })),
      recentSales: recentInvoices.map(invoice => this.invoiceResponse(invoice)),
      customersWithoutFollowUps,
    };
  }

  async getSalesDashboard(userId: number) {
    const invoiceQuery = this.invoices.createQueryBuilder('invoice')
      .innerJoinAndSelect('invoice.customer', 'customer')
      .leftJoinAndSelect('customer.assignedTo', 'salesperson')
      .where('customer.salespersonId = :userId', { userId })
      .andWhere('invoice.status != :cancelled', { cancelled: 'CANCELLED' });
    const paymentQuery = this.payments.createQueryBuilder('payment')
      .innerJoin('payment.customer', 'customer')
      .where('customer.salespersonId = :userId', { userId })
      .andWhere('payment.status = :completed', { completed: 'COMPLETED' });

    const [assignedCustomers, convertedCustomers, personalInvoices, personalPayments, revenueRow, receivedRow, recentInvoices, pendingFollowUps] = await Promise.all([
      this.customers.countBy({ salespersonId: userId }),
      this.customers.createQueryBuilder('customer')
        .innerJoin('customer.invoices', 'invoice', 'invoice.status != :cancelled', { cancelled: 'CANCELLED' })
        .where('customer.salespersonId = :userId', { userId })
        .select('COUNT(DISTINCT customer.id)', 'count')
        .getRawOne<{ count: string }>(),
      invoiceQuery.clone().getCount(),
      paymentQuery.clone().getCount(),
      invoiceQuery.clone().select('COALESCE(SUM(invoice.total), 0)', 'personalRevenue').getRawOne<{ personalRevenue: string }>(),
      paymentQuery.clone().select('COALESCE(SUM(payment.amount), 0)', 'received').getRawOne<{ received: string }>(),
      invoiceQuery.clone().orderBy('COALESCE(invoice.invoiceDate, invoice.createdAt)', 'DESC').take(10).getMany(),
      this.followUps.createQueryBuilder('followUp')
        .innerJoinAndSelect('followUp.customer', 'customer')
        .where('customer.salespersonId = :userId', { userId })
        .andWhere('followUp.status = :status', { status: 'PENDING' })
        .orderBy('followUp.dueDate', 'ASC')
        .take(10)
        .getMany(),
    ]);

    const followUpSummary = await this.getFollowUpSummary(userId);
    return {
      summary: {
        assignedCustomers,
        personalSales: personalInvoices,
        personalInvoices,
        personalPayments,
        personalRevenue: Number(revenueRow?.personalRevenue ?? 0),
        receivedPayments: Number(receivedRow?.received ?? 0),
        convertedCustomers: Number(convertedCustomers?.count ?? 0),
        conversionRate: assignedCustomers > 0
          ? Number(((Number(convertedCustomers?.count ?? 0) / assignedCustomers) * 100).toFixed(1))
          : 0,
        pendingFollowUps: pendingFollowUps.length,
        ...followUpSummary,
      },
      recentSales: recentInvoices.map(invoice => this.invoiceResponse(invoice)),
      pendingFollowUps: pendingFollowUps.map(followUp => ({
        id: followUp.id,
        note: followUp.title,
        result: followUp.description,
        nextDate: followUp.dueDate,
        createdAt: followUp.createdAt,
        customer: { id: followUp.customer.id, name: followUp.customer.name, phone: followUp.customer.phone },
      })),
    };
  }

  getCustomerStatistics(user: { id: number; role: string }) {
    return user.role === 'ADMIN' ? this.getAdminDashboard() : this.getSalesDashboard(user.id);
  }

  private async getFollowUpSummary(userId?: number) {
    const base = this.followUps.createQueryBuilder('followUp').innerJoin('followUp.customer', 'customer');
    if (userId) base.where('customer.salespersonId = :userId', { userId });
    const now = new Date(), start = new Date(now); start.setHours(0,0,0,0); const end = new Date(start); end.setDate(end.getDate()+1);
    const [todayFollowUps, overdueFollowUps, completedFollowUps] = await Promise.all([
      base.clone().andWhere('followUp.dueDate >= :start AND followUp.dueDate < :end',{start,end}).getCount(),
      base.clone().andWhere("(followUp.status = 'OVERDUE' OR (followUp.status = 'PENDING' AND followUp.dueDate < :now))",{now}).getCount(),
      base.clone().andWhere('followUp.status = :done',{done:'DONE'}).getCount(),
    ]);
    return { todayFollowUps, overdueFollowUps, completedFollowUps };
  }

  private invoiceResponse(invoice: Invoice) {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      productName: invoice.items?.map(item => item.productName).join(', ') || '',
      quantity: invoice.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
      amount: Number(invoice.total),
      createdAt: invoice.invoiceDate || invoice.createdAt,
      customer: { id: invoice.customer.id, name: invoice.customer.name, phone: invoice.customer.phone },
      salesperson: invoice.customer.assignedTo
        ? { id: invoice.customer.assignedTo.id, name: invoice.customer.assignedTo.name }
        : null,
    };
  }
}
