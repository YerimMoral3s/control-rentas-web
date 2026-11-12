import styled from 'styled-components';
import type { DefaultTheme } from 'styled-components';
import { Icon, type IconName } from '../Icon';

export type Status =
  | 'paid'
  | 'pending'
  | 'overdue'
  | 'cancelled'
  | 'active'
  | 'expired'
  | 'terminated'
  | 'available'
  | 'occupied'
  | 'maintenance';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'muted';

/** Etiquetas de F-04: siempre icono + texto. Vencido aplica a cobros y contratos. */
const STATUS: Record<Status, { label: string; icon: IconName; tone: Tone }> = {
  paid: { label: 'Pagado', icon: 'check', tone: 'success' },
  pending: { label: 'Pendiente', icon: 'clock', tone: 'warning' },
  overdue: { label: 'Vencido', icon: 'alert', tone: 'danger' },
  cancelled: { label: 'Cancelado', icon: 'minusCircle', tone: 'muted' },
  active: { label: 'Activo', icon: 'activeDot', tone: 'info' },
  expired: { label: 'Vencido', icon: 'alert', tone: 'danger' },
  terminated: { label: 'Terminado', icon: 'flag', tone: 'muted' },
  available: { label: 'Disponible', icon: 'door', tone: 'success' },
  occupied: { label: 'Ocupada', icon: 'person', tone: 'info' },
  maintenance: { label: 'En mantenimiento', icon: 'wrench', tone: 'warning' },
};

const toneColors = (tone: Tone, theme: DefaultTheme) =>
  ({
    success: [theme.color.success, theme.color.successBg],
    warning: [theme.color.warning, theme.color.warningBg],
    danger: [theme.color.danger, theme.color.dangerBg],
    info: [theme.color.info, theme.color.infoBg],
    muted: [theme.color.muted, theme.color.mutedBg],
  })[tone];

const Badge = styled.span<{ $tone: Tone; $compact: boolean }>`
  height: ${({ $compact }) => ($compact ? '26px' : '28px')};
  padding: 0 10px 0 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: none;
  white-space: nowrap;
  border-radius: ${({ theme }) => theme.radius.pill};
  font-size: 13px;
  font-weight: 700;
  color: ${({ $tone, theme }) => toneColors($tone, theme)[0]};
  background: ${({ $tone, theme }) => toneColors($tone, theme)[1]};
`;

type StatusBadgeProps = {
  status: Status;
  /** 26 px en filas de computadora. */
  compact?: boolean;
};

export function StatusBadge({ status, compact = false }: StatusBadgeProps) {
  const { label, icon, tone } = STATUS[status];
  return (
    <Badge $tone={tone} $compact={compact}>
      <Icon name={icon} size={16} strokeWidth={2.4} />
      {label}
    </Badge>
  );
}
