import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";

@Injectable()
export class DashboardService {

  constructor(
    private prisma: PrismaService,
  ) {}

  async getDashboard() {

    const customers = await this.prisma.user.count();

    const invoices = await this.prisma.invoice.findMany();

    const sales = invoices.reduce(
      (sum, item) => sum + item.sale,
      0,
    );

    const profit = invoices.reduce(
      (sum, item) => sum + item.discount,
      0,
    );

    return {

      customers,

      sales,

      profit,

      sms: 0,

    };

  }

  async getMonthlySales() {

    const invoices = await this.prisma.invoice.findMany({

      select: {

        sale: true,

        createdAt: true,

      },

    });

    const months = [

      "فروردین",

      "اردیبهشت",

      "خرداد",

      "تیر",

      "مرداد",

      "شهریور",

      "مهر",

      "آبان",

      "آذر",

      "دی",

      "بهمن",

      "اسفند",

    ];

    const sales = new Array(12).fill(0);

    invoices.forEach((invoice) => {

      const month = new Date(invoice.createdAt).getMonth();

      if (month >= 0 && month < 12) {

        sales[month] += invoice.sale;

      }

    });

    return months.map((month, index) => ({

      month,

      sale: sales[index],

    }));

  }

}