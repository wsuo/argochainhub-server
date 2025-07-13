import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TimezoneInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        return this.transformDates(data);
      }),
    );
  }

  private transformDates(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (obj instanceof Date) {
      // 将UTC时间转换为东八区时间显示
      const chinaTime = new Date(obj.getTime() + 8 * 60 * 60 * 1000);
      return chinaTime.toISOString().replace('Z', '+08:00');
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.transformDates(item));
    }

    if (typeof obj === 'object') {
      const transformed = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          transformed[key] = this.transformDates(obj[key]);
        }
      }
      return transformed;
    }

    return obj;
  }
}