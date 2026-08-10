import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { User } from './entities/user.entity';

@Controller()
export class AppController {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Invoice) private readonly invoices: Repository<Invoice>,
  ) {}

  @Get('dashboard')
  async dashboard() {
    const [customers, invoices] = await Promise.all([this.users.count(), this.invoices.find()]);
    return {
      customers,
      sales: invoices.reduce((sum, invoice) => sum + invoice.total, 0),
      profit: 0,
      sms: 0,
    };
  }
}
