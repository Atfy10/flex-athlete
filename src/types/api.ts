export type ApiResult<T> = {
  data: T;
  isSuccess: boolean;
  operationType: string;
  message: string;
  statusCode: number;
};

export type PagedData<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
};
