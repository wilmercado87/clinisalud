import { PAGINATION } from '../constants';

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export function parsePagination(query: PaginationQuery): { limit: number; offset: number } {
  const page = Math.max(1, query.page || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    Math.max(1, query.limit || PAGINATION.DEFAULT_LIMIT),
    PAGINATION.MAX_LIMIT
  );
  const offset = (page - 1) * limit;
  return { limit, offset };
}

export function buildPaginationMeta(
  query: PaginationQuery,
  total: number
): PaginationMeta {
  const page = Math.max(1, query.page || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    Math.max(1, query.limit || PAGINATION.DEFAULT_LIMIT),
    PAGINATION.MAX_LIMIT
  );
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function paginatedResponse<T>(
  data: T[],
  query: PaginationQuery,
  total: number
): PaginatedResponse<T> {
  return {
    data,
    meta: buildPaginationMeta(query, total),
  };
}