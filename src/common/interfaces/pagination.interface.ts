export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
}

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}