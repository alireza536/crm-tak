import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  private users = [];

  createUser(data: any) {
    this.users.push(data);

    return {
      message: 'User Created',
      data,
    };
  }

  getUsers() {
    return this.users;
  }
}