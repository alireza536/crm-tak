import { Injectable } from "@nestjs/common";
import * as XLSX from "xlsx";
import { PrismaService } from "../prisma.service";

@Injectable()
export class SalesService {
  private findPhone(rows: any[][]): string {

  const labels = [
    "شماره همراه",
    "تلفن همراه",
    "موبایل",
    "تلفن",
  ];

  for (const label of labels) {

    const pos = this.findText(rows, label);

    if (!pos) continue;

    // ---------- سمت راست ----------
    for (let c = pos.col + 1; c < rows[pos.row].length; c++) {

      const value = String(rows[pos.row][c] || "")
        .replace(/\D/g, "");

      if (value.length >= 10) {
        return value.slice(-11);
      }

    }

    // ---------- سمت چپ ----------
    for (let c = pos.col - 1; c >= 0; c--) {

      const value = String(rows[pos.row][c] || "")
        .replace(/\D/g, "");

      if (value.length >= 10) {
        return value.slice(-11);
      }

    }

    // ---------- ردیف پایین ----------
    if (rows[pos.row + 1]) {

      for (let c = 0; c < rows[pos.row + 1].length; c++) {

        const value = String(rows[pos.row + 1][c] || "")
          .replace(/\D/g, "");

        if (value.length >= 10) {
          return value.slice(-11);
        }

      }

    }

  }

  return "";

}

  constructor(
    private prisma: PrismaService,
  ) {}

  //------------------------------------
  // تبدیل عدد
  //------------------------------------

  private toNumber(value: any): number {

    return Number(

      String(value)
        .replace(/,/g, "")
        .replace(/\//g, "")
        .replace(/\s/g, "")
        .trim()

    ) || 0;

  }

  //------------------------------------
  // پیدا کردن متن
  //------------------------------------

  private findText(rows: any[][], keyword: string) {

    for (let i = 0; i < rows.length; i++) {

      for (let j = 0; j < rows[i].length; j++) {

        const text = String(rows[i][j] || "").trim();

        if (text.includes(keyword)) {

          return {

            row: i,

            col: j,

          };

        }

      }

    }

    return null;

  }

  //------------------------------------
  // پیدا کردن عدد کنار متن
  //------------------------------------

  private findValue(rows: any[][], keyword: string): number {

    const pos = this.findText(rows, keyword);

    if (!pos) {

      return 0;

    }

    //------------------------------------
    // ستون A همان ردیف
    //------------------------------------

    let value = this.toNumber(rows[pos.row][0]);

    if (value > 0) {

      return value;

    }

    //------------------------------------
    // سمت راست
    //------------------------------------

    for (let c = pos.col + 1; c < rows[pos.row].length; c++) {

      value = this.toNumber(rows[pos.row][c]);

      if (value > 0) {

        return value;

      }

    }

    //------------------------------------
    // سه ردیف پایین
    //------------------------------------

    for (let r = pos.row + 1; r <= pos.row + 3; r++) {

      if (!rows[r]) continue;

      for (let c = 0; c < rows[r].length; c++) {

        value = this.toNumber(rows[r][c]);

        if (value > 0) {

          return value;

        }

      }

    }

    return 0;

  }
async readExcel(buffer: Buffer) {

  const workbook = XLSX.read(buffer);

  const sheet =
    workbook.Sheets[workbook.SheetNames[0]];

  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {

    header: 1,

    defval: "",

  });

//----------------------------------------
// اطلاعات مشتری
//----------------------------------------

//----------------------------------------
// اطلاعات مشتری (سلول‌های ثابت)
//----------------------------------------

//----------------------------------------
// اطلاعات مشتری از سلول‌های ثابت
//----------------------------------------

function getCell(...cells: string[]) {
  for (const cell of cells) {
    const value = sheet[cell]?.v;
    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return String(value).trim();
    }
  }
  return "";
}

// شماره موبایل
const phone = getCell(
  "E21",
  "D21",
  "F21",
  "E22",
  "D22",
  "F22"
).replace(/\D/g, "");

// نام مشتری
const name = getCell(
  "X21",
  "W21",
  "Y21",
  "X22",
  "W22",
  "Y22"
);

// شماره فاکتور
const factor = getCell("M6");

// تاریخ
const date = getCell("M10");

// آدرس
const address = getCell(
  "D26",
  "C26",
  "E26"
);

console.log("=================================");
console.log("NAME    :", name);
console.log("PHONE   :", phone);
console.log("ADDRESS :", address);
console.log("FACTOR  :", factor);
console.log("DATE    :", date);
console.log("=================================");
  // جمع کل
  //----------------------------------------

  const sale = this.findValue(
    rows,
    "جمع کل",
  );

  //----------------------------------------
  // جمع تخفیفات
  //----------------------------------------

  const discount = this.findValue(
    rows,
    "جمع تخفيفات",
  );

  console.log("Phone :", phone);
  console.log("Factor:", factor);
  console.log("Date :", date);
  console.log("Sale :", sale);
  console.log("Discount :", discount);
let user = await this.prisma.user.findFirst({
  where: {
    phone,
  },
});

if (!user) {

  user = await this.prisma.user.create({

    data: {

      personCode: phone,

      name,

      phone,

      address,

    },

  });

}

//----------------------------------------
// خروجی برای React
//----------------------------------------

return [
  {
    name: user?.name || "پیدا نشد",
    phone,
    sale,
    profit: discount,
    factor,
    date,
  },
];

}
}
