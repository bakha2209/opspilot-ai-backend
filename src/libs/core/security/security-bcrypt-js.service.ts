import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SecurityBcryptJsService {
  async generateSalt(count = 10): Promise<string | null> {
    try {
      return await bcrypt.genSalt(count);
    } catch {
      return null;
    }
  }

  async generateHash(password: string, salt: string): Promise<string | null> {
    try {
      return await bcrypt.hash(password, salt);
    } catch {
      return null;
    }
  }

  async hashPassword(password: string, saltRounds = 10): Promise<string> {
    const salt = await this.generateSalt(saltRounds);

    if (!salt) {
      throw new Error('Failed to generate password salt');
    }

    const hash = await this.generateHash(password, salt);

    if (!hash) {
      throw new Error('Failed to generate password hash');
    }

    return hash;
  }

  async compare(password: string, databasePassword: string): Promise<-1 | 0 | 1> {
    try {
      const matched = await bcrypt.compare(password, databasePassword);
      return matched ? 1 : 0;
    } catch {
      return -1;
    }
  }
}