import { Injectable } from '@nestjs/common';

@Injectable()
export class ResponseWrapperUtil {
  /**
   * 包装成功响应
   */
  static success<T>(data: T, message: string = '操作成功'): {
    success: true;
    message: string;
    data: T;
  } {
    return {
      success: true,
      message,
      data,
    };
  }

  /**
   * 包装分页响应
   */
  static successWithPagination<T>(
    result: { data: T[]; meta: any },
    message: string = '查询成功'
  ): {
    success: true;
    message: string;
    data: T[];
    meta: any;
  } {
    return {
      success: true,
      message,
      ...result,
    };
  }

  /**
   * 包装无数据的成功响应
   */
  static successNoData(message: string = '操作成功'): {
    success: true;
    message: string;
  } {
    return {
      success: true,
      message,
    };
  }
}