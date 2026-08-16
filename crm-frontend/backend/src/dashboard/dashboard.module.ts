import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../entities/customer.entity';
import { FollowUp } from '../entities/follow-up.entity';
import { Invoice } from '../entities/invoice.entity';
import { Payment } from '../entities/payment.entity';


@Module({

imports:[TypeOrmModule.forFeature([Customer, Invoice, Payment, FollowUp])],

controllers:[
DashboardController
],

providers:[
DashboardService
]


})
export class DashboardModule {}
