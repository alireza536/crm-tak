import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer, FollowUp, Invoice, SalesCommission, User } from '../entities';
import { SalesPerformanceController } from './sales-performance.controller';
import { SalesPerformanceService } from './sales-performance.service';
@Module({imports:[TypeOrmModule.forFeature([User,Customer,Invoice,FollowUp,SalesCommission])],controllers:[SalesPerformanceController],providers:[SalesPerformanceService]})
export class SalesPerformanceModule{}
