import { Injectable } from '@nestjs/common';

import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';



@Injectable()

export class JwtStrategy extends PassportStrategy(
  Strategy,
  'jwt'
){


constructor(){

super({

jwtFromRequest:
ExtractJwt.fromAuthHeaderAsBearerToken(),


ignoreExpiration:false,


secretOrKey: process.env.JWT_SECRET || 'CRM_SECRET_KEY'


});


}



async validate(payload:any){


return {

id:payload.id,

phone:payload.phone,

role:payload.role

};


}


}
