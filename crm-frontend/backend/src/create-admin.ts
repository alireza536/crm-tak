import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from './app.module';
import { User } from './entities/user.entity';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const users = app.get(DataSource).getRepository(User);
    const password = await bcrypt.hash('123456', 10);
    const admin = await users.save(users.create({
      name: 'علی بیسجردی', phone: '09120000000', personCode: 'ADMIN001',
      address: '', password, role: 'ADMIN',
    }));
    console.log(admin);
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
