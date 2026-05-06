import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class SecurityHeaderService {
  setHeader(res: Response, key: string, value: string | string[]): boolean {
    if (!res?.setHeader) return false;

    res.setHeader(key, value);
    return true;
  }

  getHeader(req: Request, key: string): string | null {
    if (!req?.headers) return null;

    const item = req.headers[key.toLowerCase()];

    if (item === null || item === undefined) return null;
    if (typeof item === 'string') return item;
    if (Array.isArray(item) && item.length > 0) return item[0];

    return null;
  }

  getAuthorization(req: Request): string | null {
    const authorization = this.getHeader(req, 'authorization');

    if (!authorization) return null;

    const split = authorization.split('Bearer ');

    if (split.length <= 1) return null;

    return typeof split[1] === 'string' ? split[1].trim() : null;
  }
}