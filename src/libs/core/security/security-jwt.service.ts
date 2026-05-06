import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as _ from 'lodash';
import { IRecordKeyType } from '../type';

@Injectable()
export class SecurityJwtService implements OnModuleInit, OnModuleDestroy {
  protected readonly errorMap: Map<string, keyof typeof this.jwtError>;

  constructor() {
    this.errorMap = new Map<string, keyof typeof this.jwtError>();
  }

  get jwtError() {
    return {
      EXPIRED: 'EXPIRED',
      INVALID: 'INVALID',
      OPTION_ERROR: 'OPTION_ERROR',
      FAIL: 'FAIL',
    } as const;
  }

  async sign<P extends Record<IRecordKeyType, any>>(
    payload: P,
    security: string,
    options?: jwt.SignOptions,
  ): Promise<string> {
    const defaultOptions: jwt.SignOptions = {
      algorithm: 'HS256',
      expiresIn: '30m',
    };

    const mergeOptions: jwt.SignOptions = _.merge({}, defaultOptions, options);

    return new Promise((resolve, reject) => {
      jwt.sign(payload, security, mergeOptions, (err, token) => {
        if (err || !token) {
          reject(err);
          return;
        }

        resolve(token);
      });
    });
  }

  async verify<PAYLOAD = any>(
    token: string,
    security: string,
  ): Promise<PAYLOAD> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, security, (err, decoded) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(decoded as PAYLOAD);
      });
    });
  }

  findError(err: string): keyof typeof this.jwtError {
    if (!this.errorMap.has(err)) {
      return this.jwtError.FAIL;
    }

    return this.errorMap.get(err)!;
  }

  onModuleDestroy() {
    this.errorMap.clear();
  }

  onModuleInit() {
    this.errorMap.clear();

    const errorConst = this.jwtError;

    const errorObj = {
      'jwt expired': errorConst.EXPIRED,
      'invalid token': errorConst.INVALID,
      'jwt malformed': errorConst.INVALID,
      'jwt signature is required': errorConst.OPTION_ERROR,
      'invalid signature': errorConst.OPTION_ERROR,
      'jwt audience invalid': errorConst.OPTION_ERROR,
      'jwt issuer invalid': errorConst.OPTION_ERROR,
      'jwt id invalid. expected': errorConst.OPTION_ERROR,
      'jwt subject invalid': errorConst.OPTION_ERROR,
      'jwt not active': errorConst.FAIL,
    };

    Object.keys(errorObj).forEach((key) => {
      this.errorMap.set(key, errorObj[key]);
    });
  }
}