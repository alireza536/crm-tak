import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { SalesService } from "./sales.service";

@Controller("sales")
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file?.buffer) {
      throw new BadRequestException("فایل اکسل ارسال نشده است.");
    }

    if (!/\.(xlsx|xls)$/i.test(file.originalname)) {
      throw new BadRequestException("فقط فایل XLS یا XLSX قابل قبول است.");
    }

    return this.salesService.importInvoice(file.buffer, file.originalname);
  }
}
