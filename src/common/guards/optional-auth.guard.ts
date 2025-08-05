import {
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * 可选认证守卫，允许未认证用户访问
 * 如果提供了有效token则注入用户信息，否则user为undefined
 */
@Injectable()
export class OptionalAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): TUser {
    // 如果有错误或没有用户，返回undefined而不是抛出异常
    if (err || !user) {
      return undefined as TUser;
    }

    return user as TUser;
  }
}