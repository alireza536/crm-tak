import {
  Controller,
  Post,
  Get,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import * as XLSX from 'xlsx';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Controller('excel')
export class ExcelController {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

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

      const existingUser = await this.users.findOneBy({ personCode });

      if (existingUser) {

        await this.users.update({ personCode }, { name, phone, address });

        updated++;

      } else {

        await this.users.save(this.users.create({
          personCode, name, phone, address, password: '', role: 'SALES',
        }));

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
