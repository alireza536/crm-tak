import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../entities/customer.entity';
import { CustomerHistory } from '../entities/customer-history.entity';
import { User } from '../entities/user.entity';
import { CustomerImport } from '../entities/customer-import.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, CustomerHistory, CustomerImport, User])
  ],
  controllers: [
    CustomersController
  ],
  providers: [
    CustomersService
  ],
  exports: [
    CustomersService
  ]
})
export class CustomersModule {}
