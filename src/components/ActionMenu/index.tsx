import { useEffect, useId, useRef, useState } from 'react';
import styled from 'styled-components';
import { Icon } from '../Icon';

const Wrap = styled.div`
  position: relative;
`;

const Trigger = styled.button`
  height: ${({ theme }) => theme.size.touchPrimary};
  min-width: ${({ theme }) => theme.size.touchPrimary};
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid ${({ theme }) => theme.color.neutral300};
  border-radius: ${({ theme }) => theme.radius.control};
  background: ${({ theme }) => theme.color.white};
  color: ${({ theme }) => theme.color.neutral700};
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.color.neutral100};
  }
`;

const Menu = styled.ul`
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  z-index: 20;
  min-width: 220px;
  margin: 0;
  padding: 6px;
  list-style: none;
  background: ${({ theme }) => theme.color.white};
  border: 1px solid ${({ theme }) => theme.color.neutral200};
  border-radius: ${({ theme }) => theme.radius.card};
  box-shadow: 0 12px 32px rgba(16, 24, 40, 0.12);
`;

const Item = styled.button<{ $danger: boolean }>`
  width: 100%;
  min-height: ${({ theme }) => theme.size.touch};
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 0;
  border-radius: ${({ theme }) => theme.radius.control};
  background: transparent;
  color: ${({ $danger, theme }) => ($danger ? theme.color.danger : theme.color.neutral950)};
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    background: ${({ $danger, theme }) => ($danger ? theme.color.dangerBg : theme.color.neutral100)};
  }

  &:disabled {
    color: ${({ theme }) => theme.color.neutral400};
    cursor: not-allowed;
    background: transparent;
  }
`;

export type ActionMenuItem = {
  label: string;
  onSelect: () => void;
  danger?: boolean;
  /** Acción de una fase posterior: visible pero deshabilitada. */
  disabled?: boolean;
};

/**
 * "Más acciones" (F-02): abre una lista corta. Esc o tocar fuera la cierran y el foco vuelve al botón.
 */
export function ActionMenu({
  items,
  label = 'Más acciones',
}: {
  items: ActionMenuItem[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    wrapRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')?.focus();
    const onPointer = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <Wrap ref={wrapRef}>
      <Trigger
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen(current => !current)}
      >
        <Icon name="more" size={20} />
      </Trigger>
      {open ? (
        <Menu id={menuId} role="menu" aria-label={label}>
          {items.map(item => (
            <li key={item.label} role="none">
              <Item
                type="button"
                role="menuitem"
                $danger={Boolean(item.danger)}
                disabled={item.disabled}
                title={item.disabled ? 'Disponible próximamente' : undefined}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
              >
                {item.label}
              </Item>
            </li>
          ))}
        </Menu>
      ) : null}
    </Wrap>
  );
}
