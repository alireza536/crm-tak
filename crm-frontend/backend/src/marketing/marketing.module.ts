import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoleGuard } from '../auth/role.guard';
import { MarketingController } from './marketing.controller';
import { MarketingService } from './marketing.service';
import { IntelligenceModule } from '../intelligence/intelligence.module';
import { DataSource } from 'typeorm';
import { MelipayamakProvider } from './melipayamak.provider';

@Module({ imports: [IntelligenceModule], controllers: [MarketingController], providers: [MarketingService, MelipayamakProvider, JwtAuthGuard, RoleGuard] })
export class MarketingModule {}
