import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

const allowedExtensions=/\.(csv|xls|xlsx)$/i;
const allowedMimeTypes=new Set([
  'text/csv','application/csv','text/plain','application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/octet-stream',
]);

export const excelUploadOptions:MulterOptions={
  limits:{fileSize:Number(process.env.MAX_UPLOAD_BYTES||52_428_800),files:1},
  fileFilter(_request,file,callback){
    if(!allowedExtensions.test(file.originalname)||!allowedMimeTypes.has(file.mimetype)){
      return callback(new BadRequestException('Only CSV, XLS and XLSX files are supported'),false);
    }
    callback(null,true);
  },
};
