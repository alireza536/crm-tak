import { Injectable } from '@nestjs/common';

import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';
import { getJwtSecret } from './jwt-secret';



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


secretOrKey: getJwtSecret()


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
