import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from './app.module';
import { User } from './entities/user.entity';

const initialUsers = [
  {
    name: 'محبوبه حسین زاده',
    phone: '09155255645',
    plainPassword: '5645',
    role: 'SALES',
    personCode: 'SALES001',
  },
  {
    name: 'امیر ابراهیم محمدی',
    phone: '09058531174',
    plainPassword: '1174',
    role: 'SALES',
    personCode: 'SALES002',
  },
  {
    name: 'علی بیسجردی',
    phone: '09156440664',
    plainPassword: '0664',
    role: 'ADMIN',
    personCode: 'ADMIN001',
  },
  {
    name: 'علیرضا خورشیدی',
    phone: '09214430376',
    plainPassword: '0376',
    role: 'ADMIN',
    personCode: 'ADMIN002',
  },
] as const;

async function seedUsers() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const repository = app.get(DataSource).getRepository(User);

    for (const { plainPassword, ...user } of initialUsers) {
      await repository.upsert({
        ...user,
        address: '',
        password: await bcrypt.hash(plainPassword, 10),
      }, ['personCode']);
    }

    // Remove the obsolete placeholder created by the previous seed version.
    await repository.delete({ personCode: 'ADMIN003', phone: '09120000004' });

    console.log('Initial CRM users seeded successfully.');
  } finally {
    await app.close();
  }
}

seedUsers().catch((error) => {
  console.error(error);
  process.exit(1);
});
