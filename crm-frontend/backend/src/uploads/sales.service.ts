import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';

@Injectable()
export class SalesService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async create(data: any) {
    const password = await bcrypt.hash(data.password || '123456', 10);
    return this.users.save(this.users.create({
      name: data.name, phone: data.phone, address: data.address,
      personCode: data.personCode, password, role: 'SALES',
    }));
  }

  findAll() {
    return this.users.find({
      where: { role: 'SALES' },
      select: { id: true, name: true, phone: true, address: true, role: true, createdAt: true },
      order: { id: 'DESC' },
    });
  }

  findOne(id: number) {
    return this.users.findOne({
      where: { id },
      select: { id: true, name: true, phone: true, address: true, role: true },
      relations: { customers: true },
      order: { customers: { id: 'DESC' } },
    });
  }

  async remove(id: number) {
    const user = await this.users.findOneByOrFail({ id });
    return this.users.remove(user);
  }
}
