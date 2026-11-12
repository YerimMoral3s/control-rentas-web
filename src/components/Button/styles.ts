import styled, { css, keyframes } from 'styled-components';

export type ButtonVariant =
  'primary' | 'secondary' | 'neutral' | 'tertiary' | 'danger' | 'dangerTertiary';

const spin = keyframes`to { transform: rotate(360deg); }`;

/** Medidas, colores y estados de F-02 (Botones y acciones). */
const variants = {
  primary: css`
    height: ${({ theme }) => theme.size.touchPrimary};
    padding: 0 20px;
    border: 0;
    background: ${({ theme }) => theme.color.primary600};
    color: ${({ theme }) => theme.color.white};
    font-weight: 700;
    &:hover:not(:disabled),
    &:active:not(:disabled) {
      background: ${({ theme }) => theme.color.primary700};
    }
    &:disabled:not([aria-busy='true']) {
      background: ${({ theme }) => theme.color.neutral200};
      color: ${({ theme }) => theme.color.neutral400};
    }
  `,
  secondary: css`
    height: ${({ theme }) => theme.size.touch};
    padding: 0 16px;
    border: 1px solid ${({ theme }) => theme.color.primaryBorder};
    background: ${({ theme }) => theme.color.primary100};
    color: ${({ theme }) => theme.color.primary700};
    font-weight: 600;
    &:hover:not(:disabled),
    &:active:not(:disabled) {
      background: ${({ theme }) => theme.color.primaryPressed};
      border-color: ${({ theme }) => theme.color.primaryBorderStrong};
    }
    &:disabled:not([aria-busy='true']) {
      background: ${({ theme }) => theme.color.neutral100};
      border-color: ${({ theme }) => theme.color.neutral200};
      color: ${({ theme }) => theme.color.neutral400};
    }
  `,
  neutral: css`
    height: ${({ theme }) => theme.size.touchPrimary};
    padding: 0 20px;
    border: 1px solid ${({ theme }) => theme.color.neutral300};
    background: ${({ theme }) => theme.color.white};
    color: ${({ theme }) => theme.color.neutral700};
    font-weight: 600;
    &:hover:not(:disabled),
    &:active:not(:disabled) {
      background: ${({ theme }) => theme.color.neutral100};
    }
    &:disabled {
      background: ${({ theme }) => theme.color.neutral50};
      border-color: ${({ theme }) => theme.color.neutral200};
      color: ${({ theme }) => theme.color.neutral400};
    }
  `,
  tertiary: css`
    height: ${({ theme }) => theme.size.touch};
    padding: 0 12px;
    border: 0;
    background: transparent;
    color: ${({ theme }) => theme.color.primary600};
    font-weight: 600;
    &:hover:not(:disabled),
    &:active:not(:disabled) {
      background: ${({ theme }) => theme.color.primary50};
      color: ${({ theme }) => theme.color.primary700};
    }
    &:disabled:not([aria-busy='true']) {
      color: ${({ theme }) => theme.color.neutral400};
    }
  `,
  danger: css`
    height: ${({ theme }) => theme.size.touchPrimary};
    padding: 0 20px;
    border: 0;
    background: ${({ theme }) => theme.color.danger};
    color: ${({ theme }) => theme.color.white};
    font-weight: 700;
    &:hover:not(:disabled),
    &:active:not(:disabled) {
      background: ${({ theme }) => theme.color.dangerPressed};
    }
    &:focus-visible {
      outline-color: ${({ theme }) => theme.color.danger};
    }
    &:disabled:not([aria-busy='true']) {
      background: ${({ theme }) => theme.color.neutral200};
      color: ${({ theme }) => theme.color.neutral400};
    }
  `,
  dangerTertiary: css`
    height: ${({ theme }) => theme.size.touch};
    padding: 0 12px;
    border: 0;
    background: transparent;
    color: ${({ theme }) => theme.color.danger};
    font-weight: 600;
    &:hover:not(:disabled),
    &:active:not(:disabled) {
      background: ${({ theme }) => theme.color.dangerBg};
      color: ${({ theme }) => theme.color.dangerPressed};
    }
    &:focus-visible {
      outline-color: ${({ theme }) => theme.color.danger};
    }
    &:disabled {
      color: ${({ theme }) => theme.color.neutral400};
    }
  `,
};

export const StyledButton = styled.button<{ $variant: ButtonVariant; $fullWidth: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: ${({ theme }) => theme.size.touch};
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};
  border-radius: ${({ theme }) => theme.radius.control};
  font-size: 15px;
  line-height: 20px;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color ${({ theme }) => theme.motion.control} ${({ theme }) => theme.motion.enter},
    border-color ${({ theme }) => theme.motion.control} ${({ theme }) => theme.motion.enter},
    color ${({ theme }) => theme.motion.control} ${({ theme }) => theme.motion.enter};

  &:focus-visible {
    outline: ${({ theme }) => theme.focusRing};
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
  }

  &[aria-busy='true'] {
    cursor: progress;
    opacity: ${({ $variant }) => ($variant === 'tertiary' ? 0.6 : 0.75)};
  }

  ${({ $variant }) => variants[$variant]}
`;

export const Spinner = styled.span`
  width: 14px;
  height: 14px;
  flex: none;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-top-color: transparent;
  opacity: 0.8;
  animation: ${spin} 0.8s linear infinite;
`;
