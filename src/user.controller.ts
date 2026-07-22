import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";

import { UserService } from "./user.service";

@Controller("user")
export class UserController {
  constructor(
    private readonly userService: UserService,
  ) {}

  @Post()
  create(@Body() data: any) {
    return this.userService.create(data);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get("customers")
  getCustomers() {
    return this.userService.getCustomers();
  }

  @Get("profile/:id")
  getProfile(
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.userService.getProfile(id);
  }
}