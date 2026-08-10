import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../../entities/invoice.entity';
import { User } from '../../entities/user.entity';
import { Customer } from '../../entities/customer.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Invoice) private readonly invoices: Repository<Invoice>,
    @InjectRepository(Customer) private readonly customerRepository: Repository<Customer>,
  ) {}

  async getDashboard(user: any) {
    const [customers, invoiceSummary] = await Promise.all([
      user.role === 'ADMIN'
        ? this.users.count()
        : this.customerRepository.countBy({ salespersonId: user.id }),
      this.invoices.createQueryBuilder('invoice')
        .select('COALESCE(SUM(invoice.total), 0)', 'sales')
        .where(user.role === 'ADMIN' ? '1 = 1' : 'invoice.userId = :userId', { userId: user.id })
        .getRawOne<{ sales: string }>(),
    ]);

    return { customers, sales: Number(invoiceSummary?.sales || 0), profit: 0, sms: 0 };
  }

  async getMonthlySales(user: any) {
    const invoices = await this.invoices.find({
      where: user.role === 'ADMIN' ? {} : { userId: user.id },
      select: { total: true, createdAt: true },
    });
    const months = [
      'ÙØ±ÙˆØ±Ø¯ÛŒÙ†', 'Ø§Ø±Ø¯ÛŒØ¨Ù‡Ø´Øª', 'Ø®Ø±Ø¯Ø§Ø¯', 'ØªÛŒØ±', 'Ù…Ø±Ø¯Ø§Ø¯', 'Ø´Ù‡Ø±ÛŒÙˆØ±',
      'Ù…Ù‡Ø±', 'Ø¢Ø¨Ø§Ù†', 'Ø¢Ø°Ø±', 'Ø¯ÛŒ', 'Ø¨Ù‡Ù…Ù†', 'Ø§Ø³ÙÙ†Ø¯',
    ];
    const sales = new Array<number>(12).fill(0);
    invoices.forEach((invoice) => {
      const month = new Date(invoice.createdAt).getMonth();
      if (month >= 0 && month < 12) sales[month] += invoice.total;
    });
    return months.map((month, index) => ({ month, sale: sales[index] }));
  }
}
