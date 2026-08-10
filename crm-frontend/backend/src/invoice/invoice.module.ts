import { Module } from "@nestjs/common";

import { InvoiceController } from "./invoice.controller";
import { InvoiceService } from "./invoice.service";
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from '../entities/invoice.entity';
import { Customer } from '../entities/customer.entity';
import { CustomerHistory } from '../entities/customer-history.entity';
import { User } from '../entities/user.entity';

@Module({

  imports: [TypeOrmModule.forFeature([Invoice, Customer, User, CustomerHistory])],

  controllers: [

    InvoiceController,

  ],

  providers: [

    InvoiceService,

  ],

})

export class InvoiceModule {}
