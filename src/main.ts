import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma.service';
import * as bcrypt from 'bcrypt';


async function bootstrap() {

  const app = await NestFactory.create(AppModule);


  const prisma = app.get(PrismaService);


  const admin = await prisma.adminUser.findUnique({
    where:{
      username:"admin"
    }
  });


  if(!admin){

    const passwordHash = await bcrypt.hash(
      "123456",
      10
    );


    await prisma.adminUser.create({

      data:{

        username:"admin",

        passwordHash,

        role:"admin"

      }

    });


    console.log("ADMIN CREATED");

  }



  app.enableCors({

    origin:"https://crm-tak-frontend.onrender.com",

    credentials:true

  });



  await app.listen(3001);

}


bootstrap();