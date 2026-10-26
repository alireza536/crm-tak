import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,

    private readonly jwtService: JwtService,
  ) {}

  async login(phone: string, password: string) {

    const toLatinDigits = (value: string) =>
      String(value ?? '')
        .replace(/[۰-۹]/g, (digit) =>
          String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))
        )
        .replace(/[٠-٩]/g, (digit) =>
          String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit))
        );

    const normalizedPhone = toLatinDigits(phone)
      .replace(/\D/g, '');

    // Passwords are opaque secrets: do not trim or rewrite their characters.
    // Phone numbers may be normalized for lookup, but password comparison must
    // use exactly the value the user supplied when the password was created.
    const normalizedPassword = String(password ?? '');


    const user = await this.users.findOne({
      where: {
        phone: normalizedPhone,
      },
    });


    if (
      !user ||
      !(await bcrypt.compare(
        normalizedPassword,
        user.password,
      ))
    ) {
      throw new UnauthorizedException(
        'Phone or password is incorrect',
      );
    }


    const payload = {
      id: user.id,
      phone: user.phone,
      role: user.role,
    };


    return {
      access_token: this.jwtService.sign(payload),

      id: user.id,

      name: user.name,

      phone: user.phone,

      role: user.role,

      message: `خوش آمدید ${user.name}`,
    };
  }
}