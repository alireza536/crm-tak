import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";

import { FileInterceptor } from "@nestjs/platform-express";

import { SalesService } from "./sales.service";


@Controller("sales")
export class SalesController {

  constructor(
    private readonly salesService: SalesService,
  ) {}

  @Post("upload")
@UseInterceptors(FileInterceptor("file"))
async upload(
  @UploadedFile() file: any,
) {

  console.log("FILE RECEIVED:");
  console.log(file.originalname);

  const data = await this.salesService.readExcel(
    file.buffer,
  );

  console.log("EXCEL DATA:");
  console.log(data);

  return data;

}
    

  }

