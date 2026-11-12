import styled from 'styled-components';
import { media } from '@styles/theme';

const List = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  ${media.desktop} {
    flex-wrap: wrap;
    overflow: visible;
  }
`;

const Chip = styled.button<{ $active: boolean }>`
  flex: none;
  height: ${({ theme }) => theme.size.touch};
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: ${({ theme }) => theme.radius.pill};
  border: 1px solid
    ${({ $active, theme }) => ($active ? theme.color.primary600 : theme.color.neutral300)};
  background: ${({ $active, theme }) => ($active ? theme.color.primary600 : theme.color.white)};
  color: ${({ $active, theme }) => ($active ? theme.color.white : theme.color.neutral700)};
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.motion.control}
    ${({ theme }) => theme.motion.enter};

  &:hover:not([aria-disabled='true']) {
    background: ${({ $active, theme }) => ($active ? theme.color.primary600 : theme.color.primary50)};
  }

  &[aria-disabled='true'] {
    background: ${({ theme }) => theme.color.neutral100};
    border-color: ${({ theme }) => theme.color.neutral200};
    color: ${({ theme }) => theme.color.neutral400};
    cursor: not-allowed;
  }
`;

const Count = styled.span<{ $active: boolean; $disabled: boolean }>`
  min-width: 24px;
  height: 22px;
  padding: 0 6px;
  border-radius: ${({ theme }) => theme.radius.pill};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  background: ${({ $active, $disabled, theme }) =>
    $active
      ? 'rgba(255, 255, 255, 0.22)'
      : $disabled
        ? theme.color.neutral200
        : theme.color.neutral100};
`;

export type FilterChipOption<T extends string> = {
  value: T;
  label: string;
  count: number;
};

type FilterChipsProps<T extends string> = {
  label: string;
  options: ReadonlyArray<FilterChipOption<T>>;
  value: T;
  onChange: (value: T) => void;
};

/**
 * Chips de F-04. Los conteos vienen completos del servidor. Un chip en cero se ve pero no se elige;
 * si una búsqueda deja en cero el chip activo, este conserva la selección.
 */
export function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: FilterChipsProps<T>) {
  return (
    <List role="tablist" aria-label={label}>
      {options.map(option => {
        const active = option.value === value;
        const disabled = option.count === 0 && !active;
        return (
          <Chip
            key={option.value}
            type="button"
            role="tab"
            $active={active}
            aria-selected={active}
            aria-disabled={disabled || undefined}
            aria-label={`${option.label}, ${option.count}${disabled ? ', no disponible' : ''}`}
            onClick={() => {
              if (!disabled && !active) onChange(option.value);
            }}
          >
            {option.label}
            <Count aria-hidden="true" $active={active} $disabled={disabled}>
              {option.count}
            </Count>
          </Chip>
        );
      })}
    </List>
  );
}
