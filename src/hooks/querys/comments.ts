import { useMutation } from '@tanstack/react-query';
import {
  createComment,
  deactivateComment,
  getComments,
  updateComment,
  type CommentTarget,
} from '@api/comments';
import { QueryPageSize, QueryStaleTime, useBaseInfiniteQuery } from './queryBase';

export const CommentsQueryKeys = {
  root: ['comments'] as const,
  list: (target: CommentTarget) => ['comments', target.target_type, target.target_id] as const,
};

/** N-01: notas de un registro, más recientes primero; el total va en `meta.pagination.total_items`. */
export const useComments = (target: CommentTarget) =>
  useBaseInfiniteQuery(
    CommentsQueryKeys.list(target),
    (page, signal) => getComments({ ...target, page, page_size: QueryPageSize.standard }, signal),
    QueryStaleTime.operational,
  );

/** N-03: crear nota. */
export const useCreateComment = () => useMutation({ retry: false, mutationFn: createComment });

/** N-03: editar nota. */
export const useUpdateComment = () => useMutation({ retry: false, mutationFn: updateComment });

/** N-04: eliminar nota. */
export const useDeactivateComment = () =>
  useMutation({ retry: false, mutationFn: deactivateComment });
