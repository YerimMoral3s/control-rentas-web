import styled from 'styled-components';

/** Esqueleto estático de F-08: misma forma que el contenido final, sin destellos. */
export const Skeleton = styled.span<{ $width?: string; $height: string; $radius?: string }>`
  display: block;
  width: ${({ $width }) => $width ?? '100%'};
  height: ${({ $height }) => $height};
  border-radius: ${({ $radius }) => $radius ?? '6px'};
  background: ${({ theme }) => theme.color.neutral100};
`;
