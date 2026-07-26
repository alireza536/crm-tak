import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";


@Injectable()
export class AuthService {


constructor(

 private readonly prisma: PrismaService,

 private readonly jwt: JwtService,

){}




async login(
 username:string,
 password:string,
){


const user =
await this.prisma.adminUser.findUnique({

 where:{
   username,
 },

});



if(!user){

 throw new UnauthorizedException(
   "نام کاربری یا رمز عبور اشتباه است"
 );

}



const valid =
await bcrypt.compare(

 password,

 user.passwordHash

);



if(!valid){

 throw new UnauthorizedException(
   "نام کاربری یا رمز عبور اشتباه است"
 );

}



const token =
this.jwt.sign({

 id:user.id,

 username:user.username,

 role:user.role,

});



return {

 access_token: token,

 user:{
   username:user.username,
   role:user.role,
 }

};


}


}