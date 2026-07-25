import { Controller, Post, Body } from '@nestjs/common';
import { SmsService } from './sms.service';

@Controller('sms')
export class SmsController {

  constructor(
    private readonly smsService: SmsService,
  ) {}

  @Post('send')
  async send(@Body() body: any) {

    return await this.smsService.sendPatternSMS(

      body.phone,

      body.name,

      body.sale,

      body.profit,

    );

  }

  @Post('group')
  async sendGroup(@Body() body: any) {

    return await this.smsService.sendGroupSMS(
      body.users,
    );

  }

}