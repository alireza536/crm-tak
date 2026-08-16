import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { SignOptions } from 'jsonwebtoken';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { RoleGuard } from './role.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

import { User } from '../entities/user.entity';
import { getJwtSecret } from './jwt-secret';


@Global()
@Module({

  imports:[

    TypeOrmModule.forFeature([User]),

    PassportModule.register({defaultStrategy:'jwt'}),

    JwtModule.register({

      secret: getJwtSecret(),

      signOptions:{
        expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as SignOptions['expiresIn']
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
