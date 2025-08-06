import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  user?: User;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.NODE_ENV === 'development' ? true : ['http://localhost:3020', 'http://localhost:3070'],
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<number, Set<string>>(); // userId -> Set of socket IDs

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // 从查询参数或headers中获取token
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      
      if (!token) {
        client.disconnect();
        return;
      }

      // 验证JWT token
      const payload = this.jwtService.verify(token);
      
      const user = await this.userRepository.findOne({
        where: { id: payload.sub, isActive: true },
      });

      if (!user) {
        client.disconnect();
        return;
      }

      client.userId = user.id;
      client.user = user;

      // 将用户连接信息存储到Map中 - 确保使用数字类型的用户ID
      const numericUserId = Number(user.id);
      if (!this.connectedUsers.has(numericUserId)) {
        this.connectedUsers.set(numericUserId, new Set());
      }
      this.connectedUsers.get(numericUserId)!.add(client.id);

      console.log(`✅ 用户 ${user.id} (${user.name}) 连接到通知系统`);
      
      // 发送连接成功消息
      client.emit('connected', { message: '已连接到通知系统' });
      
      // 发送未读通知数量
      await this.sendUnreadCount(user.id);

    } catch (error) {
      console.error('WebSocket认证失败:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const numericUserId = Number(client.userId);
      const userSockets = this.connectedUsers.get(numericUserId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.connectedUsers.delete(numericUserId);
        }
      }
      console.log(`用户 ${client.userId} 断开连接`);
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    client.emit('pong', { timestamp: Date.now() });
  }

  // 向特定用户发送通知
  async sendNotificationToUser(userId: number, notification: any) {
    const userSockets = this.connectedUsers.get(userId);
    
    if (userSockets && userSockets.size > 0) {
      for (const socketId of userSockets) {
        this.server.to(socketId).emit('notification', notification);
      }
      console.log(`📤 向用户 ${userId} 推送通知: ${notification.title}`);
    } else {
      console.log(`⚠️ 用户 ${userId} 不在线，通知将在下次登录时显示`);
    }
  }

  // 发送未读通知数量
  async sendUnreadCount(userId: number) {
    // 这里需要注入NotificationService，但为了避免循环依赖，我们通过事件系统处理
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets && userSockets.size > 0) {
      // 暂时发送一个占位符，实际实现中通过事件获取真实数量
      for (const socketId of userSockets) {
        this.server.to(socketId).emit('unread_count', { count: 0 });
      }
    }
  }

  // 向所有在线用户广播系统通知
  broadcastSystemNotification(notification: any) {
    this.server.emit('system_notification', notification);
    console.log('广播系统通知:', notification.title);
  }

  // 获取在线用户数量
  getOnlineUserCount(): number {
    return this.connectedUsers.size;
  }

  // 获取特定用户的连接状态
  isUserOnline(userId: number): boolean {
    return this.connectedUsers.has(userId);
  }
}