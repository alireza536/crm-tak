import { Body,Controller,Get,Param,Patch,Req,UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';import { RoleGuard } from '../auth/role.guard';import { Roles } from '../auth/roles.decorator';import { SalesPerformanceService } from './sales-performance.service';
@Controller('sales-performance')@UseGuards(JwtAuthGuard,RoleGuard)@Roles('ADMIN','SALES')
export class SalesPerformanceController{constructor(private readonly service:SalesPerformanceService){}@Get()all(@Req()req:any){return this.service.getPerformance(req.user)}@Patch(':userId/commission')@Roles('ADMIN')commission(@Param('userId')userId:string,@Body()body:any){return this.service.updateCommission(Number(userId),body)}}
