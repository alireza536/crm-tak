import { Injectable, ServiceUnavailableException } from '@nestjs/common';

type MelipayamakSendResponse = { Value?: string | number; value?: string | number; RetStatus?: string | number };

@Injectable()
export class MelipayamakProvider {
  isConfigured() {
    return Boolean(process.env.SMS_USERNAME?.trim() && process.env.SMS_PASSWORD?.trim() && process.env.SMS_FROM?.trim());
  }

  assertConfigured() {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException('SMS delivery is not configured. Set SMS_USERNAME, SMS_PASSWORD and SMS_FROM on the backend.');
    }
  }

  async send(phone: string, text: string): Promise<string> {
    this.assertConfigured();
    const to = this.normalizeIranianMobile(phone);
    const from = process.env.SMS_FROM!.trim();
    const body = new URLSearchParams({
      username: process.env.SMS_USERNAME!.trim(),
      password: process.env.SMS_PASSWORD!.trim(),
      to,
      from,
      text,
      isFlash: 'false',
    });

    let response: Response;
    try {
      response = await fetch('https://rest.payamak-panel.com/api/SendSMS/SendSMS', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(20000),
      });
    } catch {
      throw new Error('SMS provider request failed or timed out');
    }

    if (!response.ok) throw new Error(`SMS provider returned HTTP ${response.status}`);
    let result: MelipayamakSendResponse;
    try {
      result = await response.json() as MelipayamakSendResponse;
    } catch {
      throw new Error('SMS provider returned an invalid response');
    }

    const receipt = result.Value ?? result.value ?? result.RetStatus;
    if (receipt === undefined || receipt === null || !/^\d+$/.test(String(receipt)) || Number(receipt) <= 0) {
      throw new Error('SMS provider rejected the message');
    }
    return String(receipt);
  }

  private normalizeIranianMobile(phone: string) {
    const digits = String(phone || '').replace(/\D/g, '');
    if (/^00989\d{9}$/.test(digits)) return `0${digits.slice(4)}`;
    if (/^989\d{9}$/.test(digits)) return `0${digits.slice(2)}`;
    if (/^9\d{9}$/.test(digits)) return `0${digits}`;
    if (/^09\d{9}$/.test(digits)) return digits;
    throw new Error('Customer phone is not a supported Iranian mobile number');
  }
}
