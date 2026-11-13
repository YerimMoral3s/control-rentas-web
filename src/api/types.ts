/** Contrato común: apis/estandar_respuestas_backend_control_rentas.txt */

export type Pagination = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
};

export type ApiMeta = {
  request_id: string;
  pagination?: Pagination;
};

export type PaginatedMeta = ApiMeta & { pagination: Pagination };

export type ApiSuccess<TData, TMeta extends ApiMeta = ApiMeta> = {
  data: TData;
  meta: TMeta;
  message?: string;
};

export type ApiFieldError = {
  field: string;
  code: string;
  message: string;
};

export type ApiErrorBody = {
  error: {
    type: string;
    code: string;
    title?: string;
    detail?: string;
    status: number;
    details?: { fields?: ApiFieldError[] } & Record<string, unknown>;
  };
  meta?: { request_id?: string };
};
