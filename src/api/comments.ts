import { apiRequest } from './http';
import type { PaginatedMeta } from './types';

/** Contrato: apis/comments_api_control_rentas.txt (en la interfaz se llaman "Notas"). */

export type CommentTargetType = 'property' | 'unit' | 'tenant' | 'contract' | 'expense' | 'payment';

export type Comment = {
  id: string;
  target_type: CommentTargetType;
  target_id: string;
  content: string;
  status: 'active' | 'inactive';
  deactivated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CommentTarget = { target_type: CommentTargetType; target_id: string };

/** GET /v1/comments — notas activas de un registro, de la más reciente a la más antigua. */
export const getComments = (
  params: CommentTarget & { page: number; page_size: number },
  signal?: AbortSignal,
) =>
  apiRequest<Comment[], PaginatedMeta>({
    method: 'GET',
    url: '/comments',
    params,
    signal,
    operation: 'comments_list',
  });

/** POST /v1/comments — N-03 crear nota. */
export const createComment = (body: CommentTarget & { content: string }) =>
  apiRequest<Comment>({
    method: 'POST',
    url: '/comments',
    data: body,
    operation: 'comment_create',
  });

/** PATCH /v1/comments/:id — N-03 editar (conserva la fecha original). */
export const updateComment = ({ commentId, content }: { commentId: string; content: string }) =>
  apiRequest<Comment>({
    method: 'PATCH',
    url: `/comments/${encodeURIComponent(commentId)}`,
    data: { content },
    operation: 'comment_update',
  });

/** PATCH /v1/comments/:id/deactivate — N-04 eliminar (baja lógica). */
export const deactivateComment = (commentId: string) =>
  apiRequest<{ id: string; status: 'inactive'; deactivated_at: string | null }>({
    method: 'PATCH',
    url: `/comments/${encodeURIComponent(commentId)}/deactivate`,
    operation: 'comment_deactivate',
  });
