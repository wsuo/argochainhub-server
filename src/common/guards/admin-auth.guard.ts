import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminUser } from '../../entities/admin-user.entity';

@Injectable()
export class AdminAuthGuard extends AuthGuard('jwt') {
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

    // 确保用户是管理员类型
    if (!(user instanceof AdminUser)) {
      throw new UnauthorizedException('Admin access required');
    }

    return user as TUser;
  }
}
