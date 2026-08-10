import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(phone: string, password: string) {
    const user = await this.users.findOneBy({ phone });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Phone or password is incorrect');
    }

    const payload = { id: user.id, phone: user.phone, role: user.role };

    return {
      access_token: this.jwtService.sign(payload),
      id: user.id,
      name: user.name,
      role: user.role,
      message: `خوش آمدید ${user.name}`,
    };
  }
}
