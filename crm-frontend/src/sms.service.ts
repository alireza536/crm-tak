import { Injectable } from '@nestjs/common';
import * as soap from 'soap';

@Injectable()
export class SmsService {

  private username = '989156440664';
private password =
'be96be9a-6b76-4ba8-bea4-037ccbf911bd';
  private bodyId = 485147;

  private wsdl =
    'https://api.payamak-panel.com/post/send.asmx?WSDL';

  async sendPatternSMS(

    phone: string,

    name: string,

    sale: string,

    discount: string,

  ) {

    const cleanPhone = phone
      .split('-')[0]
      .replace(/\s/g, '')
      .trim();

    const cleanName = name
  .replace(/ي/g, "ی")
  .replace(/ك/g, "ک")
  .replace(/فروشگاه.*/g, "")
  .replace(/سوپر مارکت.*/g, "")
  .replace(/موبايل.*/g, "")
  .replace(/موبایل.*/g, "")
  .trim();

    const saleText = String(Number(sale));
const discountText = String(Number(discount));

const text =
`${cleanName};${saleText};${discountText}`;
    console.log('=======================');
    console.log('PHONE =>', cleanPhone);
    console.log('BODYID =>', this.bodyId);
    console.log('TEXT =>', text);
    console.log('=======================');

    const client = await soap.createClientAsync(
      this.wsdl,
    );

    const args = {

      username: this.username,

      password: this.password,

      text,

      to: cleanPhone,

      bodyId: this.bodyId,

    };

    console.log(args);

    try {

      const [result] =
        await client.SendByBaseNumber2Async(args);

      console.log(result);

      return result;

    } catch (err) {

      console.log(err);

      throw err;

    }

  }

  async sendGroupSMS(users: any[]) {

    const results = [];

    for (const user of users) {

      try {

        const result =
          await this.sendPatternSMS(

            user.phone,

            user.name,

            String(user.sale),

            String(user.profit),

          );

        results.push({

          phone: user.phone,

          success: true,

          result,

        });

      } catch (error) {

        results.push({

          phone: user.phone,

          success: false,

          error: String(error),

        });

      }

    }

    return {

      total: users.length,

      success:
        results.filter(x => x.success).length,

      failed:
        results.filter(x => !x.success).length,

      results,

    };

  }

}