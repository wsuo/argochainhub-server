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
import { AdminUser } from '../entities/admin-user.entity';
import { AdminNotification, AdminNotificationStatus } from '../entities/admin-notification.entity';
import { AdminPermission } from '../types/permissions';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  user?: User;
  adminUserId?: number;
  adminUser?: AdminUser;
  userType?: 'user' | 'admin';
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      // 开发环境：允许所有来源，包括 file:// 协议
      if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        // 生产环境：只允许特定域名
        const allowedOrigins = ['http://localhost:3020', 'http://localhost:3070'];
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // 用户连接管理 - userId -> Set of socket IDs
  private connectedUsers = new Map<number, Set<string>>();
  
  // 管理员连接管理 - adminUserId -> Set of socket IDs
  private connectedAdmins = new Map<number, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
    @InjectRepository(AdminNotification)
    private readonly adminNotificationRepository: Repository<AdminNotification>,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    console.log('🔌 WebSocket 连接尝试, clientId:', client.id);
    try {
      // 从查询参数或headers中获取token
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      const clientType = client.handshake.query?.type || 'user'; // 'user' or 'admin'
      
      console.log('🔑 Token存在:', !!token, 'Client类型:', clientType);
      
      if (!token) {
        console.log('❌ Token缺失, 断开连接');
        client.disconnect();
        return;
      }

      // 验证JWT token
      const payload = this.jwtService.verify(token);
      console.log('✅ JWT验证成功, payload:', payload);
      
      if (clientType === 'admin') {
        // 管理员连接处理
        console.log('👨‍💼 处理管理员连接');
        await this.handleAdminConnection(client, payload);
      } else {
        // 普通用户连接处理
        console.log('👤 处理用户连接');
        await this.handleUserConnection(client, payload);
      }

    } catch (error) {
      console.error('❌ WebSocket认证失败:', error.message);
      client.disconnect();
    }
  }

  private async handleUserConnection(client: AuthenticatedSocket, payload: any) {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub, isActive: true },
    });

    if (!user) {
      client.disconnect();
      return;
    }

    client.userId = user.id;
    client.user = user;
    client.userType = 'user';

    // 将用户连接信息存储到Map中 - 确保使用数字类型的用户ID
    const numericUserId = Number(user.id);
    if (!this.connectedUsers.has(numericUserId)) {
      this.connectedUsers.set(numericUserId, new Set());
    }
    this.connectedUsers.get(numericUserId)!.add(client.id);

    console.log(`✅ 用户 ${user.id} (${user.name}) 连接到通知系统`);
    
    // 发送连接成功消息
    client.emit('connected', { message: '已连接到通知系统', type: 'user' });
    
    // 发送未读通知数量
    await this.sendUnreadCount(user.id);
  }

  private async handleAdminConnection(client: AuthenticatedSocket, payload: any) {
    console.log('🔍 检查管理员连接, payload.type:', payload.type);
    
    // 检查是否为管理员token
    if (payload.type !== 'admin') {
      console.log('❌ 不是管理员token, 断开连接, payload.type:', payload.type);
      client.disconnect();
      return;
    }

    console.log('🔍 查找管理员用户, ID:', payload.sub);
    const adminUser = await this.adminUserRepository.findOne({
      where: { id: payload.sub, isActive: true },
    });

    if (!adminUser) {
      console.log('❌ 管理员用户不存在或未激活, 断开连接');
      client.disconnect();
      return;
    }

    console.log('✅ 管理员用户验证成功:', adminUser.username);
    client.adminUserId = adminUser.id;
    client.adminUser = adminUser;
    client.userType = 'admin';

    // 将管理员连接信息存储到Map中
    const numericAdminUserId = Number(adminUser.id);
    if (!this.connectedAdmins.has(numericAdminUserId)) {
      this.connectedAdmins.set(numericAdminUserId, new Set());
    }
    this.connectedAdmins.get(numericAdminUserId)!.add(client.id);

    console.log('🎉 管理员WebSocket连接成功, 用户:', adminUser.username, 'ID:', adminUser.id);
    console.log('📊 当前连接的管理员数量:', this.connectedAdmins.size);
    
    // 发送连接成功消息
    client.emit('connected', { 
      message: '已连接到管理员通知系统', 
      type: 'admin',
      role: adminUser.role,
      permissions: adminUser.getAllPermissions()
    });
    
    // 发送未读通知数量
    await this.sendAdminUnreadCount(adminUser.id);
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userType === 'admin' && client.adminUserId) {
      // 管理员断开连接
      const numericAdminUserId = Number(client.adminUserId);
      const adminSockets = this.connectedAdmins.get(numericAdminUserId);
      if (adminSockets) {
        adminSockets.delete(client.id);
        if (adminSockets.size === 0) {
          this.connectedAdmins.delete(numericAdminUserId);
        }
      }
      console.log(`❌ 管理员 ${client.adminUserId} 断开连接`);
      
    } else if (client.userType === 'user' && client.userId) {
      // 普通用户断开连接
      const numericUserId = Number(client.userId);
      const userSockets = this.connectedUsers.get(numericUserId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.connectedUsers.delete(numericUserId);
        }
      }
      console.log(`❌ 用户 ${client.userId} 断开连接`);
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

  // 向特定管理员发送通知
  async sendNotificationToAdmin(adminUserId: number, notification: any) {
    const adminSockets = this.connectedAdmins.get(adminUserId);
    
    if (adminSockets && adminSockets.size > 0) {
      for (const socketId of adminSockets) {
        this.server.to(socketId).emit('admin_notification', notification);
      }
      console.log(`📤 向管理员 ${adminUserId} 推送通知: ${notification.title}`);
    } else {
      console.log(`⚠️ 管理员 ${adminUserId} 不在线，通知将在下次登录时显示`);
    }
  }

  // 基于权限向管理员群发通知
  async broadcastToAdminsByPermission(requiredPermissions: AdminPermission[], notification: any) {
    const sentToAdmins = new Set<number>();
    
    for (const [adminUserId, sockets] of this.connectedAdmins.entries()) {
      // 获取管理员信息
      const adminUser = await this.adminUserRepository.findOne({
        where: { id: adminUserId, isActive: true },
      });

      if (!adminUser) continue;

      // 检查权限
      if (!adminUser.hasAnyPermission(requiredPermissions)) continue;

      // 发送通知
      if (sockets.size > 0) {
        for (const socketId of sockets) {
          this.server.to(socketId).emit('admin_notification', notification);
        }
        sentToAdmins.add(adminUserId);
      }
    }

    console.log(`📤 向 ${sentToAdmins.size} 个管理员推送权限通知: ${notification.title}`);
    return Array.from(sentToAdmins);
  }

  // 向所有在线管理员广播通知
  async broadcastToAllAdmins(notification: any) {
    let sentCount = 0;
    
    for (const sockets of this.connectedAdmins.values()) {
      if (sockets.size > 0) {
        for (const socketId of sockets) {
          this.server.to(socketId).emit('admin_notification', notification);
        }
        sentCount++;
      }
    }

    console.log(`📤 向 ${sentCount} 个管理员广播通知: ${notification.title}`);
    return sentCount;
  }

  // 发送用户未读通知数量
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

  // 发送管理员未读通知数量
  async sendAdminUnreadCount(adminUserId: number) {
    const adminSockets = this.connectedAdmins.get(adminUserId);
    if (adminSockets && adminSockets.size > 0) {
      try {
        // 直接查询数据库获取实际的未读通知数量
        const unreadCount = await this.adminNotificationRepository.count({
          where: {
            adminUserId,
            status: AdminNotificationStatus.UNREAD,
          },
        });
        
        for (const socketId of adminSockets) {
          this.server.to(socketId).emit('admin_unread_count', { count: unreadCount });
        }
        
        console.log(`📊 向管理员 ${adminUserId} 推送未读数量: ${unreadCount}`);
      } catch (error) {
        console.error('获取管理员未读数量失败:', error);
        // 发生错误时仍然发送一个默认值，避免前端卡住
        for (const socketId of adminSockets) {
          this.server.to(socketId).emit('admin_unread_count', { count: 0 });
        }
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

  // 获取在线管理员数量
  getOnlineAdminCount(): number {
    return this.connectedAdmins.size;
  }

  // 获取特定用户的连接状态
  isUserOnline(userId: number): boolean {
    return this.connectedUsers.has(userId);
  }

  // 获取特定管理员的连接状态
  isAdminOnline(adminUserId: number): boolean {
    return this.connectedAdmins.has(adminUserId);
  }

  // 获取在线统计信息
  getOnlineStats() {
    return {
      totalUsers: this.connectedUsers.size,
      totalAdmins: this.connectedAdmins.size,
      totalConnections: 
        Array.from(this.connectedUsers.values()).reduce((sum, sockets) => sum + sockets.size, 0) +
        Array.from(this.connectedAdmins.values()).reduce((sum, sockets) => sum + sockets.size, 0),
    };
  }
}