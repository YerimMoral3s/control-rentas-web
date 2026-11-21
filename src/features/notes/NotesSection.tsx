import { useState } from 'react';
import styled from 'styled-components';
import { isAppError } from '@api/errors';
import type { Comment, CommentTarget } from '@api/comments';
import {
  Button,
  DetailSection,
  Dialog,
  DialogActions,
  ListFooter,
  Notice,
  SectionError,
  Skeleton,
} from '@components';
import {
  useComments,
  useCreateComment,
  useDeactivateComment,
  useUpdateComment,
} from '@hooks/querys/comments';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';
import { formatDateTime } from '@lib/dates';

const Composer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-size: 15px;
    font-weight: 600;
  }
`;

const Area = styled.textarea`
  min-height: 88px;
  padding: 10px 12px;
  resize: vertical;
  border: 1px solid ${({ theme }) => theme.color.neutral300};
  border-radius: ${({ theme }) => theme.radius.control};
  background: ${({ theme }) => theme.color.white};
  font: inherit;
  font-size: 16px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral950};

  &:focus-visible {
    outline: ${({ theme }) => theme.focusRing};
    outline-offset: 2px;
  }
`;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
`;

const Saved = styled.span`
  margin-right: auto;
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.color.success};
`;

const Items = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Card = styled.li`
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: ${({ theme }) => theme.color.white};
  border: 1px solid ${({ theme }) => theme.color.neutral200};
  border-radius: ${({ theme }) => theme.radius.card};

  small {
    font-size: 13px;
    color: ${({ theme }) => theme.color.neutral600};
  }

  p {
    margin: 0;
    font-size: 15px;
    line-height: 22px;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
`;

const Empty = styled.p`
  margin: 0;
  font-size: 15px;
  color: ${({ theme }) => theme.color.neutral600};
`;

type NotesSectionProps = {
  target: CommentTarget;
  /** "este pago", "esta propiedad"… para los textos. */
  label: string;
  /** Registro inactivo: se consultan sus notas pero no se agregan nuevas. */
  readOnlyReason?: string | null;
};

const errorText = (error: unknown, fallback: string) =>
  isAppError(error) && error.code === 'INACTIVE_ENTITY_CANNOT_RECEIVE_COMMENT'
    ? 'Este registro ya no recibe notas nuevas.'
    : isAppError(error) && error.code === 'COMMENT_INACTIVE'
      ? 'Esta nota ya se eliminó.'
      : fallback;

/** Una nota: fecha original, "· Editada" y edición en la misma tarjeta (N-03). */
function NoteCard({
  note,
  readOnly,
  onDelete,
  target,
}: {
  note: Comment;
  readOnly: boolean;
  onDelete: (note: Comment) => void;
  target: CommentTarget;
}) {
  const events = useInvalidateEvents();
  const update = useUpdateComment();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.content);
  const [error, setError] = useState<string | null>(null);
  const edited = note.updated_at !== note.created_at;

  const save = () => {
    setError(null);
    update.mutate(
      { commentId: note.id, content: draft.trim() },
      {
        onSuccess: () => {
          setEditing(false);
          void events.commentsChanged(target);
        },
        onError: err =>
          setError(errorText(err, 'No pudimos guardar los cambios. Tu texto sigue aquí.')),
      },
    );
  };

  return (
    <Card>
      <small>
        {formatDateTime(note.created_at)}
        {edited ? ' · Editada' : ''}
      </small>
      {editing ? (
        <>
          <Area
            aria-label="Editar nota"
            value={draft}
            onChange={event => setDraft(event.target.value)}
            disabled={update.isPending}
          />
          {error ? <Notice tone="error" title={error} /> : null}
          <Row>
            <Button
              variant="secondary"
              onClick={() => {
                setEditing(false);
                setDraft(note.content);
                setError(null);
              }}
              disabled={update.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={save}
              loading={update.isPending}
              disabled={!draft.trim() || draft.trim() === note.content}
            >
              Guardar cambios
            </Button>
          </Row>
        </>
      ) : (
        <>
          <p>{note.content}</p>
          {readOnly ? null : (
            <Row>
              <Button variant="tertiary" onClick={() => setEditing(true)}>
                Editar nota
              </Button>
              <Button variant="dangerTertiary" onClick={() => onDelete(note)}>
                Eliminar nota
              </Button>
            </Row>
          )}
        </>
      )}
    </Card>
  );
}

/**
 * N-01 a N-04: notas de un registro (propiedad, unidad, inquilino, contrato, gasto o pago). Sin autor,
 * respuestas ni archivos. Crear y editar no piden confirmación; eliminar sí. Una nota no cambia
 * importes, fechas, estados ni relaciones.
 */
export function NotesSection({ target, label, readOnlyReason }: NotesSectionProps) {
  const events = useInvalidateEvents();
  const query = useComments(target);
  const create = useCreateComment();
  const deactivate = useDeactivateComment();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState<Comment | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const readOnly = Boolean(readOnlyReason);
  const total = query.meta?.pagination.total_items;

  const add = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    setError(null);
    setSaved(false);
    create.mutate(
      { ...target, content: draft.trim() },
      {
        onSuccess: () => {
          setDraft('');
          setSaved(true);
          void events.commentsChanged(target);
        },
        onError: err =>
          setError(errorText(err, 'No pudimos guardar la nota. Tu texto sigue aquí.')),
      },
    );
  };

  const confirmDelete = () => {
    if (!deleting) return;
    setDeleteError(null);
    deactivate.mutate(deleting.id, {
      onSuccess: () => {
        setDeleting(null);
        setSaved(false);
        void events.commentsChanged(target);
      },
      onError: err => {
        if (isAppError(err) && err.code === 'COMMENT_INACTIVE') {
          setDeleting(null);
          void events.commentsChanged(target);
          return;
        }
        setDeleteError('No pudimos eliminar la nota. La lista no cambió. Inténtalo de nuevo.');
      },
    });
  };

  return (
    <DetailSection title="Notas" count={total}>
      {readOnly ? (
        <Notice tone="info" title="Ya no se pueden agregar notas">
          {readOnlyReason}
        </Notice>
      ) : (
        <Composer onSubmit={add}>
          <label htmlFor={`note-${target.target_id}`}>Nueva nota</label>
          <Area
            id={`note-${target.target_id}`}
            placeholder="Escribe una nota…"
            value={draft}
            onChange={event => {
              setDraft(event.target.value);
              setSaved(false);
            }}
            disabled={create.isPending}
          />
          {error ? <Notice tone="error" title={error} /> : null}
          <Row>
            {saved ? <Saved role="status">Nota guardada</Saved> : null}
            <Button
              type="submit"
              loading={create.isPending}
              loadingLabel="Guardando…"
              disabled={!draft.trim()}
            >
              {error ? 'Intentar de nuevo' : 'Guardar nota'}
            </Button>
          </Row>
        </Composer>
      )}
      {query.isPending ? (
        <Skeleton $height="96px" />
      ) : query.isError && !query.data ? (
        <SectionError onRetry={() => void query.refetch()} retrying={query.isFetching} />
      ) : query.items.length === 0 ? (
        <Empty>Aún no hay notas en {label}.</Empty>
      ) : (
        <div aria-busy={query.isPlaceholderData || undefined}>
          <Items>
            {query.items.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                readOnly={readOnly}
                target={target}
                onDelete={next => {
                  setDeleteError(null);
                  setDeleting(next);
                }}
              />
            ))}
          </Items>
          <ListFooter
            query={query}
            endLabel="No hay más notas"
            errorLabel="No pudimos cargar más notas"
          />
        </div>
      )}
      <Dialog
        open={deleting !== null}
        title="¿Eliminar esta nota?"
        onClose={() => setDeleting(null)}
        busy={deactivate.isPending}
      >
        <Empty>Ya no aparecerá en {label}.</Empty>
        {deleteError ? <Notice tone="error" title={deleteError} /> : null}
        <DialogActions>
          <Button variant="danger" onClick={confirmDelete} loading={deactivate.isPending}>
            {deleteError ? 'Intentar de nuevo' : 'Eliminar nota'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setDeleting(null)}
            disabled={deactivate.isPending}
            data-initial-focus
          >
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </DetailSection>
  );
}
