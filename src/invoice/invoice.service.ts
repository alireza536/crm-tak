import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

@Injectable()
export class InvoiceService {

  async getAll() {

    return prisma.invoice.findMany({

      include: {

        user: true,

      },

      orderBy: {

        createdAt: "desc",

      },

    });

  }

}