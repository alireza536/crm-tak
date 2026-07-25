import { BadRequestException, Injectable } from "@nestjs/common";
import * as XLSX from "xlsx";
import { PrismaService } from "../prisma.service";

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeDigits(value: unknown): string {
    const map: Record<string, string> = {
      "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
      "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
      "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
      "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
    };

    return String(value ?? "").replace(/[۰-۹٠-٩]/g, (digit) => map[digit] ?? digit);
  }

  private cleanText(value: unknown): string {
    return this.normalizeDigits(value).replace(/\s+/g, " ").trim();
  }

  private toNumber(value: unknown): number {
    const normalized = this.normalizeDigits(value)
      .replace(/[٬,]/g, "")
      .replace(/[^0-9.-]/g, "")
      .trim();

    const result = Number(normalized);
    return Number.isFinite(result) ? result : 0;
  }

  private getCell(sheet: XLSX.WorkSheet, ...cells: string[]): string {
    for (const cell of cells) {
      const value = sheet[cell]?.v;
      const text = this.cleanText(value);
      if (text) return text;
    }
    return "";
  }

  private findText(rows: unknown[][], keywords: string[]) {
    for (let row = 0; row < rows.length; row += 1) {
      for (let col = 0; col < (rows[row]?.length ?? 0); col += 1) {
        const text = this.cleanText(rows[row][col]);
        if (keywords.some((keyword) => text.includes(keyword))) {
          return { row, col };
        }
      }
    }
    return null;
  }

  private findNearbyNumber(rows: unknown[][], keywords: string[]): number {
    const position = this.findText(rows, keywords);
    if (!position) return 0;

    const candidates: unknown[] = [];
    const currentRow = rows[position.row] ?? [];

    for (let col = position.col + 1; col < currentRow.length; col += 1) {
      candidates.push(currentRow[col]);
    }
    for (let col = position.col - 1; col >= 0; col -= 1) {
      candidates.push(currentRow[col]);
    }
    for (let row = position.row + 1; row <= position.row + 3; row += 1) {
      candidates.push(...(rows[row] ?? []));
    }

    for (const candidate of candidates) {
      const number = this.toNumber(candidate);
      if (number > 0) return number;
    }

    return 0;
  }

  private normalizePhone(value: unknown): string {
    let phone = this.normalizeDigits(value).replace(/\D/g, "");
    if (phone.startsWith("98") && phone.length >= 12) phone = `0${phone.slice(2)}`;
    if (phone.length > 11) phone = phone.slice(-11);
    return phone;
  }

  async importInvoice(buffer: Buffer, originalName: string) {
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new BadRequestException("فایل اکسل هیچ برگه‌ای ندارد.");
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: "",
      raw: false,
    });

    const factor = this.getCell(sheet, "M6", "N6", "L6") ||
      this.cleanText(this.findNearbyNumber(rows, ["شماره فاکتور", "شماره فاكتور"]));

    const date = this.getCell(sheet, "M10", "N10", "L10");
    const name = this.getCell(sheet, "X21", "W21", "Y21", "X22", "W22", "Y22");
    const address = this.getCell(sheet, "D26", "C26", "E26");
    const rawPhone = this.getCell(sheet, "E21", "D21", "F21", "E22", "D22", "F22");
    const phone = this.normalizePhone(rawPhone);

    const sale = this.findNearbyNumber(rows, ["جمع کل", "جمع كل", "مبلغ نهایی", "مبلغ نهايي"]);
    const discount = this.findNearbyNumber(rows, ["جمع تخفیفات", "جمع تخفيفات", "تخفیف", "تخفيف"]);

    if (!factor) {
      throw new BadRequestException("شماره فاکتور در فایل پیدا نشد.");
    }
    if (!phone) {
      throw new BadRequestException("شماره موبایل مشتری در فایل پیدا نشد.");
    }
    if (sale <= 0) {
      throw new BadRequestException("مبلغ جمع کل فاکتور در فایل پیدا نشد.");
    }

    const duplicate = await this.prisma.invoice.findFirst({
      where: { factor: String(factor) } as any,
      include: { user: true },
    });

    if (duplicate) {
      return {
        success: true,
        duplicate: true,
        message: `فاکتور شماره ${factor} قبلاً ثبت شده و دوباره ذخیره نشد.`,
        invoice: duplicate,
      };
    }

    let user = await this.prisma.user.findFirst({ where: { phone } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          personCode: phone,
          name: name || `مشتری ${phone}`,
          phone,
          address,
        },
      });
    } else if ((!user.name || !user.address) && (name || address)) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          name: user.name || name || `مشتری ${phone}`,
          address: user.address || address || "",
        },
      });
    }

    const invoice = await this.prisma.invoice.create({
      data: {
        factor: String(factor),
        sale,
        discount,
        userId: user.id,
      } as any,
      include: { user: true },
    });

    return {
      success: true,
      duplicate: false,
      message: `فاکتور شماره ${factor} با موفقیت برای ${user.name} ثبت شد.`,
      sourceFile: originalName,
      extracted: { factor: String(factor), date, phone, name: user.name, sale, discount },
      invoice,
    };
  }
}
