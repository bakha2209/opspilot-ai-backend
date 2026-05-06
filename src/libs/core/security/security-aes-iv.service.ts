import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';

@Injectable()
export class SecurityAESIVService {
  readonly secretKey: Buffer;

  static ALGORITHM = 'aes-256-cbc';
  static IV_LENGTH = 16;

  constructor(private readonly configService: ConfigService) {
    let key = this.configService.get<string>('BACKEND_SERVER_SECURITY_AES');

    if (!key) {
      key = crypto.randomBytes(32).toString('base64');
    } else if (key.length > 64) {
      key = key.slice(0, 64);
    }

    this.secretKey = Buffer.from(key, 'base64');
  }

  encrypt(message: string): string {
    const iv = crypto.randomBytes(SecurityAESIVService.IV_LENGTH);
    const cipher = crypto.createCipheriv(
      SecurityAESIVService.ALGORITHM,
      this.secretKey,
      iv,
    );

    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedText: string): string {
    const [ivHex, encrypted] = encryptedText.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(
      SecurityAESIVService.ALGORITHM,
      this.secretKey,
      iv,
    );

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  obfuscate(message: string): string {
    const salt = crypto.randomBytes(4).toString('hex');
    return Buffer.from(salt + message).toString('base64');
  }

  deobfuscate(obfuscatedText: string): string {
    const decoded = Buffer.from(obfuscatedText, 'base64').toString('utf8');
    return decoded.slice(8);
  }
}