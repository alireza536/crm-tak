import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from './app.module';
import { User } from './entities/user.entity';

const initialUsers = [
  { name: 'محبوبه حسین زاده', phone: '09155255645', password: '5645', role: 'SALES', personCode: 'SALES001' },
  { name: 'امیر ابراهیم محمدی', phone: '09058531174', password: '1174', role: 'SALES', personCode: 'SALES002' },
  { name: 'علی بیسجردی', phone: '09156440664', password: '0664', role: 'ADMIN', personCode: 'ADMIN001' },
  { name: 'علیرضا خورشیدی', phone: '09214430376', password: '0376', role: 'ADMIN', personCode: 'ADMIN002' },
] as const;

async function ensureMissingInitialUsers(app: NestExpressApplication) {
  const users = app.get(DataSource).getRepository(User);
  for (const initialUser of initialUsers) {
    const existing = await users.findOne({
      where: [{ phone: initialUser.phone }, { personCode: initialUser.personCode }],
    });
    if (existing) continue;

    await users.save(users.create({
      name: initialUser.name,
      phone: initialUser.phone,
      personCode: initialUser.personCode,
      role: initialUser.role,
      password: await bcrypt.hash(initialUser.password, 10),
      address: '',
    }));
  }
}

async function bootstrap() {

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Import payloads are processed in yielding batches; avoid Express' small default JSON limit.
  app.useBodyParser('json', { limit: '512mb' });

  app.enableCors();

  await ensureMissingInitialUsers(app);

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port, '0.0.0.0');

}
bootstrap();
import 'reflect-metadata';
import 'dotenv/config';
