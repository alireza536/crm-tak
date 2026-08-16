import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import dataSource from './data-source';
import { User } from './entities/user.entity';

async function createProductionAdmin() {
  const name = process.env.INITIAL_ADMIN_NAME?.trim();
  const phone = process.env.INITIAL_ADMIN_PHONE?.trim();
  const personCode = process.env.INITIAL_ADMIN_PERSON_CODE?.trim();
  const password = process.env.INITIAL_ADMIN_PASSWORD;

  if (!name || !phone || !personCode || !password || password.length < 12) {
    throw new Error('INITIAL_ADMIN_NAME, INITIAL_ADMIN_PHONE, INITIAL_ADMIN_PERSON_CODE and a 12+ character INITIAL_ADMIN_PASSWORD are required.');
  }

  await dataSource.initialize();
  try {
    const users = dataSource.getRepository(User);
    const existing = await users.findOne({ where: [{ phone }, { personCode }] });
    if (existing) {
      console.log('Admin creation skipped: phone or person code already exists.');
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await users.save(users.create({ name, phone, personCode, password: passwordHash, role: 'ADMIN', address: null }));
    console.log('Production admin created successfully. Remove INITIAL_ADMIN_PASSWORD from shell history/environment now.');
  } finally {
    await dataSource.destroy();
  }
}

createProductionAdmin().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
