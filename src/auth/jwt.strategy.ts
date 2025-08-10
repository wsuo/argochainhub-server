import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User, UserType } from '../entities/user.entity';
import { AdminUser } from '../entities/admin-user.entity';

export interface JwtPayload {
  sub: number;
  email?: string;
  username?: string;
  companyId?: number | null;
  companyType?: string | null;
  userType?: UserType;
  role: string;
  type?: string; // 'admin' for AdminUser, undefined for regular User
  loginSource?: 'buyer' | 'supplier' | 'admin'; // 登录来源标识
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || 'default-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<User | AdminUser> {
    // 如果是管理员token
    if (payload.type === 'admin') {
      const adminUser = await this.adminUserRepository.findOne({
        where: { id: payload.sub, isActive: true },
      });

      if (!adminUser) {
        throw new UnauthorizedException('Admin user not found or inactive');
      }

      return adminUser;
    }

    // 普通用户token
    const user = await this.userRepository.findOne({
      where: { id: payload.sub, isActive: true },
      relations: ['company'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }
}
