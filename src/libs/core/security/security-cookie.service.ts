import { Injectable } from '@nestjs/common';
import { CookieOptions, Request, Response } from 'express';
import * as _ from 'lodash';

@Injectable()
export class SecurityCookieService {
  get defaultCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    };
  }

  saveCookie(
    res: Response,
    key: string,
    value: string,
    options?: CookieOptions,
  ): boolean {
    if (!res?.cookie) return false;

    res.cookie(key, value, _.merge({}, this.defaultCookieOptions, options));
    return true;
  }

  getCookie(req: Request, key: string): string | null {
    if (req.signedCookies && req.signedCookies[key]) {
      return req.signedCookies[key] as string;
    }

    if (!req.cookies) return null;

    return (req.cookies[key] as string) ?? null;
  }

  deleteCookie(
    res: Response,
    key: string | string[],
    options?: CookieOptions,
  ): boolean {
    if (!res?.clearCookie) return false;

    const mergedOptions = _.merge({}, this.defaultCookieOptions, options);

    if (Array.isArray(key)) {
      key.forEach((k) => res.clearCookie(k, mergedOptions));
      return true;
    }

    res.clearCookie(key, mergedOptions);
    return true;
  }
}