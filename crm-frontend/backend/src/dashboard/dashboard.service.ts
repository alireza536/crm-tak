import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { FollowUp } from '../entities/follow-up.entity';
import { Sale } from '../entities/sale.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Customer) private readonly customers: Repository<Customer>,
    @InjectRepository(Sale) private readonly sales: Repository<Sale>,
    @InjectRepository(FollowUp) private readonly followUps: Repository<FollowUp>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async getAdminDashboard() {
    const withoutFollowUpsQuery = this.customers.createQueryBuilder('customer')
      .leftJoin('customer.followUps', 'followUp')
      .where('followUp.id IS NULL');

    const [
      totalCustomers,
      totalSales,
      revenueRow,
      salesPerformanceRows,
      recentSales,
      customersWithoutFollowUpsCount,
      customersWithoutFollowUps,
    ] = await Promise.all([
      this.customers.count(),
      this.sales.count(),
      this.sales.createQueryBuilder('sale')
        .select('COALESCE(SUM(sale.amount), 0)', 'totalRevenue')
        .getRawOne<{ totalRevenue: string }>(),
      this.users.createQueryBuilder('salesperson')
        .leftJoin('salesperson.sales', 'sale')
        .where('salesperson.role = :role', { role: 'SALES' })
        .select('salesperson.id', 'userId')
        .addSelect('salesperson.name', 'name')
        .addSelect('COUNT(sale.id)', 'salesCount')
        .addSelect('COALESCE(SUM(sale.amount), 0)', 'revenue')
        .groupBy('salesperson.id')
        .addGroupBy('salesperson.name')
        .orderBy('COALESCE(SUM(sale.amount), 0)', 'DESC')
        .getRawMany<{ userId: string; name: string; salesCount: string; revenue: string }>(),
      this.sales.find({
        relations: { customer: true, user: true },
        order: { createdAt: 'DESC' },
        take: 10,
      }),
      withoutFollowUpsQuery.clone().getCount(),
      withoutFollowUpsQuery.clone()
        .select([
          'customer.id', 'customer.name', 'customer.storeName', 'customer.phone',
          'customer.status', 'customer.salespersonId', 'customer.createdAt',
        ])
        .orderBy('customer.createdAt', 'DESC')
        .take(10)
        .getMany(),
    ]);

    return {
      summary: {
        totalCustomers,
        totalSales,
        totalRevenue: Number(revenueRow?.totalRevenue ?? 0),
        customersWithoutFollowUps: customersWithoutFollowUpsCount,
      },
      salesPerformance: salesPerformanceRows.map((row) => ({
        userId: Number(row.userId),
        name: row.name,
        salesCount: Number(row.salesCount),
        revenue: Number(row.revenue),
      })),
      recentSales: recentSales.map((sale) => this.saleResponse(sale)),
      customersWithoutFollowUps,
    };
  }

  async getSalesDashboard(userId: number) {
    const [
      assignedCustomers,
      personalSales,
      revenueRow,
      recentSales,
      pendingFollowUpsCount,
      pendingFollowUps,
    ] = await Promise.all([
      this.customers.countBy({ salespersonId: userId }),
      this.sales.countBy({ userId }),
      this.sales.createQueryBuilder('sale')
        .select('COALESCE(SUM(sale.amount), 0)', 'personalRevenue')
        .where('sale.userId = :userId', { userId })
        .getRawOne<{ personalRevenue: string }>(),
      this.sales.find({
        where: { userId },
        relations: { customer: true, user: true },
        order: { createdAt: 'DESC' },
        take: 10,
      }),
      this.followUps.countBy({ userId, status: 'PENDING' }),
      this.followUps.find({
        where: { userId, status: 'PENDING' },
        relations: { customer: true },
        order: { dueDate: 'ASC', createdAt: 'DESC' },
        take: 10,
      }),
    ]);

    return {
      summary: {
        assignedCustomers,
        personalSales,
        personalRevenue: Number(revenueRow?.personalRevenue ?? 0),
        pendingFollowUps: pendingFollowUpsCount,
      },
      recentSales: recentSales.map((sale) => this.saleResponse(sale)),
      pendingFollowUps: pendingFollowUps.map((followUp) => ({
        id: followUp.id,
        note: followUp.title,
        result: followUp.description,
        nextDate: followUp.dueDate,
        createdAt: followUp.createdAt,
        customer: {
          id: followUp.customer.id,
          name: followUp.customer.name,
          phone: followUp.customer.phone,
        },
      })),
    };
  }

  // Retained for callers using the previous service method name.
  getCustomerStatistics(user: { id: number; role: string }) {
    return user.role === 'ADMIN' ? this.getAdminDashboard() : this.getSalesDashboard(user.id);
  }

  private saleResponse(sale: Sale) {
    return {
      id: sale.id,
      productName: sale.productName,
      quantity: sale.quantity,
      amount: sale.amount,
      createdAt: sale.createdAt,
      customer: {
        id: sale.customer.id,
        name: sale.customer.name,
        phone: sale.customer.phone,
      },
      salesperson: {
        id: sale.user.id,
        name: sale.user.name,
      },
    };
  }
}
