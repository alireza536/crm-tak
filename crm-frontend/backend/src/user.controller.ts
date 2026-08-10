import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RoleGuard } from './auth/role.guard';
import { Roles } from './auth/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('ADMIN')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }
}
