// Shared API types used by both the v1 public API and server action responses.

/** Versioned success response envelope for the public REST API. */
export type ApiSuccessResponse<T> = {
  data: T;
  meta: {
    version: "1";
    requestId: string;
  };
};

/** Error envelope for the public REST API. */
export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/** Server action result — all mutations return this shape; never throw to the client. */
export type ActionResult<T = void> =
  | { data: T; error: null }
  | { data: null; error: { code: string; message: string } };

/** Pagination params accepted by list endpoints. */
export type PaginationParams = {
  page?: number;
  pageSize?: number;
};

/** Paginated list envelope. */
export type PaginatedList<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};
