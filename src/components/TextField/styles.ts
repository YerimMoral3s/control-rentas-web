import styled, { css } from 'styled-components';

export const FieldRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

export const Label = styled.label`
  font-size: 15px;
  line-height: 22px;
  font-weight: 600;
  color: ${({ theme }) => theme.color.neutral700};
`;

export const Help = styled.span`
  font-size: 13px;
  line-height: 18px;
  color: ${({ theme }) => theme.color.neutral600};
`;

export const ErrorText = styled.span`
  display: flex;
  gap: 6px;
  font-size: 13px;
  line-height: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.color.danger};

  svg {
    margin-top: 1px;
  }
`;

/** Contenedor de F-03: 48 px, borde 1 px, radio 10. Foco y error sin mover el contenido. */
export const Control = styled.div<{ $invalid?: boolean; $readOnly?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: ${({ theme }) => theme.size.field};
  padding: 0 14px;
  border: 1px solid ${({ theme }) => theme.color.neutral300};
  border-radius: ${({ theme }) => theme.radius.control};
  background: ${({ theme }) => theme.color.white};
  color: ${({ theme }) => theme.color.neutral950};
  overflow: hidden;
  transition: box-shadow ${({ theme }) => theme.motion.control} ${({ theme }) => theme.motion.enter};

  &:focus-within {
    border-color: ${({ theme }) => theme.color.primary600};
    box-shadow:
      inset 0 0 0 1px ${({ theme }) => theme.color.primary600},
      0 0 0 3px ${({ theme }) => theme.color.primary100};
  }

  ${({ $invalid, theme }) =>
    $invalid &&
    css`
      &,
      &:focus-within {
        border-color: ${theme.color.danger};
        box-shadow: inset 0 0 0 1px ${theme.color.danger};
      }
    `}

  ${({ $readOnly, theme }) =>
    $readOnly &&
    css`
      border-style: dashed;
      background: ${theme.color.neutral100};
      color: ${theme.color.neutral700};
    `}
`;

export const Input = styled.input`
  flex: 1;
  min-width: 0;
  height: 44px;
  border: 0;
  padding: 0;
  background: transparent;
  font-size: 15px;
  color: inherit;
  outline: none;

  &:focus-visible {
    outline: none;
  }

  &::placeholder {
    color: ${({ theme }) => theme.color.neutral400};
  }
`;

/** Prefijo "$" del campo de importe. */
export const Prefix = styled.span`
  align-self: stretch;
  display: flex;
  align-items: center;
  margin-left: -14px;
  padding: 0 12px;
  background: ${({ theme }) => theme.color.neutral50};
  border-right: 1px solid ${({ theme }) => theme.color.neutral200};
  font-size: 15px;
  font-weight: 700;
  color: ${({ theme }) => theme.color.neutral600};
`;

/** Sufijo "MXN" del campo de importe. */
export const Suffix = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.color.neutral600};
`;

export const TrailingIcon = styled.span`
  display: flex;
  color: ${({ theme }) => theme.color.neutral600};
`;
