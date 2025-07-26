import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminUser } from '../../entities/admin-user.entity';
import { User } from '../../entities/user.entity';

/**
 * 灵活的认证守卫，同时支持普通用户和管理员认证
 */
@Injectable()
export class FlexibleAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid token');
    }

    // 确保用户是管理员或普通用户类型
    if (!(user instanceof AdminUser) && !(user instanceof User)) {
      throw new UnauthorizedException('Invalid user type');
    }

    return user as TUser;
  }
}