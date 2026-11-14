import { useId } from 'react';
import styled from 'styled-components';
import type { PropertyType } from '@api/properties';
import { Icon } from '@components';
import { media } from '@styles/theme';
import { PROPERTY_TYPE_OPTIONS } from '../setupText';

const Cards = styled.div`
  display: grid;
  gap: 10px;

  ${media.desktop} {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
`;

const Card = styled.label<{ $selected: boolean; $disabled: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px 44px 14px 16px;
  border-radius: ${({ theme }) => theme.radius.card};
  border: 1px solid
    ${({ $selected, theme }) => ($selected ? theme.color.primary600 : theme.color.neutral300)};
  box-shadow: ${({ $selected, theme }) =>
    $selected ? `inset 0 0 0 1px ${theme.color.primary600}` : 'none'};
  background: ${({ $selected, theme }) => ($selected ? theme.color.primary50 : theme.color.white)};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};

  &:has(input:focus-visible) {
    outline: ${({ theme }) => theme.focusRing};
    outline-offset: 2px;
  }

  strong {
    font-size: 16px;
    line-height: 22px;
  }

  span {
    font-size: 15px;
    line-height: 22px;
    color: ${({ theme }) => theme.color.neutral700};
  }

  small {
    font-size: 13px;
    line-height: 18px;
    color: ${({ theme }) => theme.color.neutral600};
  }

  svg {
    position: absolute;
    top: 14px;
    right: 14px;
    color: ${({ theme }) => theme.color.primary600};
  }
`;

type TypeCardsProps = {
  value: PropertyType | undefined;
  onChange: (type: PropertyType) => void;
  /** Tipos que no admiten las unidades ya agregadas. */
  isDisabled?: (type: PropertyType) => boolean;
  disabledNote?: string;
};

/** P-05: un tipo por tarjeta, con radios nativos (teclado con flechas). */
export function TypeCards({ value, onChange, isDisabled, disabledNote }: TypeCardsProps) {
  const name = useId();
  return (
    <Cards role="radiogroup" aria-label="Tipo de propiedad">
      {PROPERTY_TYPE_OPTIONS.map(option => {
        const selected = option.value === value;
        const disabled = !selected && Boolean(isDisabled?.(option.value));
        return (
          <Card key={option.value} $selected={selected} $disabled={disabled}>
            <input
              type="radio"
              className="visually-hidden"
              name={name}
              value={option.value}
              checked={selected}
              disabled={disabled}
              onChange={() => onChange(option.value)}
            />
            <strong>{option.title}</strong>
            <span>{option.description}</span>
            <small>{disabled && disabledNote ? disabledNote : option.units}</small>
            {selected ? <Icon name="check" size={20} strokeWidth={2.6} /> : null}
          </Card>
        );
      })}
    </Cards>
  );
}
