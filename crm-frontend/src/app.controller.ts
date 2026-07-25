import { Controller, Get } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Controller()
export class AppController {

  @Get("dashboard")
  async dashboard(){

    const customers = await prisma.user.count();

    const invoices = await prisma.invoice.findMany();

    const sales = invoices.reduce(
      (sum,i)=>sum+i.sale,
      0,
    );

    const profit = invoices.reduce(
      (sum,i)=>sum+i.discount,
      0,
    );

    return{

      customers,

      sales,

      profit,

      sms:0

    };

  }

}