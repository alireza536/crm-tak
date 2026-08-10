import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { Customer } from './entities/customer.entity';
import { User } from './entities/user.entity';

const sampleCustomers = [
  {
    name: 'ÙØ±ÙˆØ´Ú¯Ø§Ù‡ ØªØ³Øª ÛŒÚ©',
    phone: '09111111111',
    salespersonCode: 'SALES001',
  },
  {
    name: 'ÙØ±ÙˆØ´Ú¯Ø§Ù‡ ØªØ³Øª Ø¯Ùˆ',
    phone: '09222222222',
    salespersonCode: 'SALES002',
  },
  {
    name: 'ÙØ±ÙˆØ´Ú¯Ø§Ù‡ Ø¨Ø¯ÙˆÙ† Ù…Ø³Ø¦ÙˆÙ„',
    phone: '09333333333',
    salespersonCode: null,
  },
] as const;

async function seedCustomers() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const dataSource = app.get(DataSource);
    const customers = dataSource.getRepository(Customer);
    const users = dataSource.getRepository(User);

    for (const sample of sampleCustomers) {
      const salesperson = sample.salespersonCode
        ? await users.findOneBy({ personCode: sample.salespersonCode, role: 'SALES' })
        : null;

      if (sample.salespersonCode && !salesperson) {
        throw new Error(`Sales user ${sample.salespersonCode} was not found. Run seed:users first.`);
      }

      await customers.upsert({
        name: sample.name,
        phone: sample.phone,
        status: 'ACTIVE',
        customerType: 'NORMAL',
        initialScore: 0,
        healthScore: 0,
        salespersonId: salesperson?.id ?? null,
      }, ['phone']);
    }

    console.log('Sample CRM customers seeded successfully.');
  } finally {
    await app.close();
  }
}

seedCustomers().catch((error) => {
  console.error(error);
  process.exit(1);
});
