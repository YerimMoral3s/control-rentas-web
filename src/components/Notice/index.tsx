import type { ReactNode } from 'react';
import styled, { type DefaultTheme } from 'styled-components';
import { Icon, type IconName } from '../Icon';

export type NoticeTone = 'success' | 'info' | 'uncertain' | 'error';

const TONES: Record<NoticeTone, { icon: IconName; role: 'status' | 'alert' }> = {
  success: { icon: 'check', role: 'status' },
  info: { icon: 'info', role: 'status' },
  uncertain: { icon: 'alert', role: 'alert' },
  error: { icon: 'alert', role: 'alert' },
};

const toneColors = (tone: NoticeTone, { color }: DefaultTheme) =>
  ({
    success: { fg: color.success, bg: color.successBg, border: color.successBorder },
    info: { fg: color.info, bg: color.infoBg, border: color.infoBorder },
    uncertain: { fg: color.warning, bg: color.warningBg, border: color.warningBorder },
    error: { fg: color.danger, bg: color.dangerBg, border: color.dangerBorder },
  })[tone];

const Box = styled.div<{ $tone: NoticeTone }>`
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 14px 8px 14px 16px;
  border-radius: ${({ theme }) => theme.radius.card};
  border: 1px solid ${({ $tone, theme }) => toneColors($tone, theme).border};
  background: ${({ $tone, theme }) => toneColors($tone, theme).bg};
  color: ${({ $tone, theme }) => toneColors($tone, theme).fg};

  svg {
    margin-top: 1px;
  }
`;

const Body = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding-right: 8px;
`;

const Title = styled.span`
  font-size: 15px;
  line-height: 22px;
  font-weight: 700;
`;

const Text = styled.span`
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral700};
`;

const Reference = styled.span`
  font-size: 13px;
  line-height: 18px;
  color: ${({ theme }) => theme.color.neutral600};
  user-select: all;
  overflow-wrap: anywhere;
`;

const CloseButton = styled.button`
  width: 44px;
  height: 44px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: -10px 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  cursor: pointer;
`;

type NoticeProps = {
  tone: NoticeTone;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  /** Solo en resultado incierto o error inesperado: referencia para pedir ayuda. */
  requestId?: string;
  onClose?: () => void;
};

/**
 * Aviso localizado de F-08: junto al contexto afectado y permanece hasta cerrarlo.
 * Nunca muestra códigos técnicos; la referencia se presenta con texto amable.
 */
export function Notice({ tone, title, children, action, requestId, onClose }: NoticeProps) {
  const { icon, role } = TONES[tone];
  return (
    <Box $tone={tone} role={role}>
      <Icon name={icon} size={20} strokeWidth={2.4} />
      <Body>
        <Title>{title}</Title>
        {children ? <Text>{children}</Text> : null}
        {requestId ? (
          <Reference>Si necesitas ayuda, comparte este código: {requestId}</Reference>
        ) : null}
        {action}
      </Body>
      {onClose ? (
        <CloseButton type="button" aria-label="Cerrar aviso" onClick={onClose}>
          <Icon name="close" size={16} strokeWidth={2.4} />
        </CloseButton>
      ) : null}
    </Box>
  );
}
