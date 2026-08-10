import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { RoleGuard } from './role.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

import { User } from '../entities/user.entity';


@Global()
@Module({

  imports:[

    TypeOrmModule.forFeature([User]),

    PassportModule.register({defaultStrategy:'jwt'}),

    JwtModule.register({

      secret: process.env.JWT_SECRET || 'CRM_SECRET_KEY',

      signOptions:{
        expiresIn:'7d'
      }

    })

  ],


  controllers:[

    AuthController

  ],


  providers:[

    AuthService,

    JwtStrategy,

    RoleGuard,

    JwtAuthGuard

  ],


  exports:[

    AuthService,

    RoleGuard,

    JwtAuthGuard

  ]

})


export class AuthModule {}
