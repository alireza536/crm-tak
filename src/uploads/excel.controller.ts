import {
  Controller,
  Post,
  Get,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Controller('excel')
export class ExcelController {

  @Get()
  test() {
    return {
      message: 'Excel API Working',
    };
  }
  

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: any) {

    const workbook = XLSX.read(file.buffer, {
      type: 'buffer',
    });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows: any[] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
    });

    let inserted = 0;
    let updated = 0;

    // شروع داده‌ها از ردیف 18
    for (let i = 18; i < rows.length; i++) {

      const row: any[] = rows[i];

      const address = String(row[0] || '').trim();
      const phone = String(row[11] || '').trim();
      const name = String(row[22] || '').trim();
      const personCode = String(row[25] || '').trim();

      if (!personCode) {
        continue;
      }

      const existingUser = await prisma.user.findUnique({
        where: {
          personCode,
        },
      });

      if (existingUser) {

        await prisma.user.update({
          where: {
            personCode,
          },
          data: {
            name,
            phone,
            address,
          },
        });

        updated++;

      } else {

        await prisma.user.create({
          data: {
            personCode,
            name,
            phone,
            address,
          },
        });

        inserted++;

      }
    }

    return {
      message: 'Excel Imported Successfully',
      inserted,
      updated,
      total: rows.length,
    };
  }
}