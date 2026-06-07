import { Controller, Get, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  createUser(@Body() body: any) {
    return this.userService.createUser(body);
  }

  @Get()
  getUsers() {
    return this.userService.getUsers();
  }
}