import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { AuthPayload } from '../../auth/types/auth-payload.type';
import { SecurityCookieService, SecurityHeaderService, SecurityJwtService } from '../../../libs/core/security';

type AuthenticatedSocket = Socket & {
  user?: AuthPayload;
};

@Injectable()
@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: SecurityJwtService,
    private readonly headerService: SecurityHeaderService,
    private readonly cookieService: SecurityCookieService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const user = await this.authenticateSocket(client);
      client.user = user;

      if (user.companyId) {
        await client.join(this.getCompanyRoom(user.companyId));
      }

      await client.join(this.getUserRoom(user.sub));

      this.logger.log(
        `Socket connected: ${client.id}, user=${user.email}, company=${user.companyId}`,
      );

      client.emit('connected', {
        message: 'Connected to OpsPilot realtime gateway',
        userId: user.sub,
        companyId: user.companyId,
      });
    } catch (error) {
      this.logger.warn(`Socket authentication failed: ${client.id}`);
      client.emit('error', {
        message: 'Unauthorized socket connection',
      });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('ping')
  handlePing(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: any,
  ) {
    return {
      event: 'pong',
      data: {
        socketId: client.id,
        userId: client.user?.sub,
        received: body ?? null,
        timestamp: new Date().toISOString(),
      },
    };
  }

  emitToCompany(companyId: string, event: string, payload: any) {
    this.server.to(this.getCompanyRoom(companyId)).emit(event, payload);
  }

  emitToUser(userId: string, event: string, payload: any) {
    this.server.to(this.getUserRoom(userId)).emit(event, payload);
  }

  emitNotificationToCompany(companyId: string, payload: any) {
    this.emitToCompany(companyId, 'notification.created', payload);
  }

  private async authenticateSocket(
    client: AuthenticatedSocket,
  ): Promise<AuthPayload> {
    const token =
      this.extractTokenFromHandshake(client) ||
      this.extractTokenFromCookieHeader(client);

    if (!token) {
      throw new UnauthorizedException('Socket token is missing');
    }

    const secret = this.configService.get<string>('JWT_ACCESS_SECRET');

    if (!secret) {
      throw new UnauthorizedException('JWT secret is missing');
    }

    return this.jwtService.verify<AuthPayload>(token, secret);
  }

  private extractTokenFromHandshake(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;

    if (typeof authToken === 'string' && authToken.trim()) {
      return authToken.replace('Bearer ', '').trim();
    }

    const authorization = client.handshake.headers?.authorization;

    if (typeof authorization === 'string') {
      const split = authorization.split('Bearer ');
      if (split.length > 1) {
        return split[1].trim();
      }
    }

    const queryToken = client.handshake.query?.token;

    if (typeof queryToken === 'string' && queryToken.trim()) {
      return queryToken.replace('Bearer ', '').trim();
    }

    return null;
  }

  private extractTokenFromCookieHeader(client: Socket): string | null {
    const cookieHeader = client.handshake.headers?.cookie;

    if (!cookieHeader) return null;

    const cookies = cookieHeader
      .split(';')
      .reduce<Record<string, string>>((acc, cookie) => {
        const [key, ...valueParts] = cookie.trim().split('=');
        acc[key] = decodeURIComponent(valueParts.join('='));
        return acc;
      }, {});

    return cookies['access_token'] ?? null;
  }

  private getCompanyRoom(companyId: string) {
    return `company:${companyId}`;
  }

  private getUserRoom(userId: string) {
    return `user:${userId}`;
  }
}
