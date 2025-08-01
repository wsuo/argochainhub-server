import { Injectable } from '@nestjs/common';
import { PaginatedResult } from '../dto/pagination.dto';

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
   * 包装分页响应 - 统一使用PaginatedResult格式
   */
  static successWithPagination<T>(
    result: PaginatedResult<T>,
    message: string = '查询成功'
  ): {
    success: true;
    message: string;
    data: T[];
    meta: {
      totalItems: number;
      currentPage: number;
      totalPages: number;
      itemsPerPage: number;
    };
  } {
    return {
      success: true,
      message,
      data: result.data,
      meta: {
        totalItems: result.meta.totalItems,
        currentPage: result.meta.currentPage,
        totalPages: result.meta.totalPages,
        itemsPerPage: result.meta.itemsPerPage,
      },
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