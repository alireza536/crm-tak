import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {

  const passwordHash = await bcrypt.hash(
    "m1a2h3d4i5",
    10
  );


  const exist = await prisma.adminUser.findUnique({
    where:{
      username:"admin"
    }
  });


  if(exist){

    console.log("ADMIN ALREADY EXISTS");

    return;

  }


  const user = await prisma.adminUser.create({

    data:{

      username:"admin",

      passwordHash,

      role:"admin",

    },

  });


  console.log(
    "ADMIN CREATED:",
    user.username
  );

}


main()
.then(()=>process.exit())
.catch((e)=>{

 console.error(e);

 process.exit(1);

});