import { Injectable } from '@nestjs/common';

@Injectable()
export class SecurityBase64Service {
  encode<T extends string | number | Record<string | number, any> | Array<any>>(
    message: T,
  ): string {
    const serialize =
      typeof message === 'string' ? message : JSON.stringify(message);

    return Buffer.from(serialize, 'utf-8').toString('base64');
  }

  decode<PAYLOAD = any>(encoded: string): PAYLOAD | null {
    if (!encoded || encoded.trim() === '') return null;

    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');

    if (!decoded) return null;

    try {
      return JSON.parse(decoded) as PAYLOAD;
    } catch {
      return decoded as PAYLOAD;
    }
  }
}