import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoleGuard } from '../auth/role.guard';
import { Customer, Invoice, Sale } from '../entities';
import { IntelligenceController } from './intelligence.controller';
import { IntelligenceService } from './intelligence.service';

@Module({ imports: [TypeOrmModule.forFeature([Customer, Invoice, Sale])], controllers: [IntelligenceController], providers: [IntelligenceService, JwtAuthGuard, RoleGuard], exports: [IntelligenceService] })
export class IntelligenceModule {}
