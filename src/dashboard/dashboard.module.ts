import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../entities/customer.entity';
import { FollowUp } from '../entities/follow-up.entity';
import { Sale } from '../entities/sale.entity';
import { User } from '../entities/user.entity';


@Module({

imports:[TypeOrmModule.forFeature([Customer, Sale, FollowUp, User])],

controllers:[
DashboardController
],

providers:[
DashboardService
]


})
export class DashboardModule {}
