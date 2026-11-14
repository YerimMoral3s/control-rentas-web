import styled from 'styled-components';
import { useInfiniteScroll } from '@lib/useInfiniteScroll';
import { Button } from '../Button';
import { Skeleton } from '../Skeleton';

const Footer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px 0 4px;
  font-size: 13px;
  line-height: 18px;
  color: ${({ theme }) => theme.color.neutral600};
`;

const Sentinel = styled.div`
  height: 1px;
`;

type InfiniteState = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  fetchNextPage: () => unknown;
};

type ListFooterProps = {
  query: InfiniteState;
  /** "No hay más cobros", "No hay más inquilinos"… */
  endLabel: string;
  /** "No pudimos cargar más cobros"… */
  errorLabel: string;
  skeletonHeight?: string;
};

/** S-02 y S-07: scroll infinito al final de una lista, fin de lista y reintento localizado. */
export function ListFooter({
  query,
  endLabel,
  errorLabel,
  skeletonHeight = '64px',
}: ListFooterProps) {
  const sentinelRef = useInfiniteScroll(
    () => void query.fetchNextPage(),
    query.hasNextPage && !query.isFetchingNextPage && !query.isFetchNextPageError,
  );

  return (
    <>
      <Sentinel ref={sentinelRef} aria-hidden="true" />
      <Footer>
        {query.isFetchingNextPage ? (
          <Skeleton $height={skeletonHeight} $radius="14px" />
        ) : query.isFetchNextPageError ? (
          <>
            <span role="alert">{errorLabel}</span>
            <Button variant="secondary" icon="retry" onClick={() => void query.fetchNextPage()}>
              Intentar de nuevo
            </Button>
          </>
        ) : !query.hasNextPage ? (
          <span>{endLabel}</span>
        ) : null}
      </Footer>
    </>
  );
}
