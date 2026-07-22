import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async create(data: any) {
    return this.prisma.user.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.user.findMany();
  }

  async getCustomers() {
    const users = await this.prisma.user.findMany({
      include: {
        invoices: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    return users.map((u) => {
      const totalSale = u.invoices.reduce(
        (sum, item) => sum + item.sale,
        0,
      );

      const totalDiscount = u.invoices.reduce(
        (sum, item) => sum + item.discount,
        0,
      );

      return {
        id: u.id,
        name: u.name,
        phone: u.phone,
        address: u.address,
        personCode: u.personCode,

        totalSale,
        totalDiscount,

        invoiceCount: u.invoices.length,

        lastInvoice:
          u.invoices.length > 0
            ? u.invoices[0].createdAt
            : null,
      };
    });
  }

  async getProfile(id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        invoices: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!user) {
      return {
        message: "Customer Not Found",
      };
    }

    const totalSale = user.invoices.reduce(
      (sum, item) => sum + item.sale,
      0,
    );

    const totalDiscount = user.invoices.reduce(
      (sum, item) => sum + item.discount,
      0,
    );

    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      address: user.address,
      personCode: user.personCode,

      totalSale,
      totalDiscount,

      invoiceCount: user.invoices.length,

      lastInvoice:
        user.invoices.length > 0
          ? user.invoices[0].createdAt
          : null,

      invoices: user.invoices,
    };
  }
}