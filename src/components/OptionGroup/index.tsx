import { useId } from 'react';
import styled from 'styled-components';
import { Icon } from '../Icon';
import { Label } from '../TextField/styles';

const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Options = styled.div`
  display: flex;
  gap: 8px;
`;

const Option = styled.label<{ $selected: boolean }>`
  flex: 1;
  min-height: ${({ theme }) => theme.size.touch};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 8px;
  border-radius: ${({ theme }) => theme.radius.control};
  /* Borde siempre de 1 px: el seleccionado suma un trazo interior para no mover el contenido. */
  border: 1px solid
    ${({ $selected, theme }) => ($selected ? theme.color.primary600 : theme.color.neutral300)};
  box-shadow: ${({ $selected, theme }) => ($selected ? `inset 0 0 0 1px ${theme.color.primary600}` : 'none')};
  background: ${({ $selected, theme }) => ($selected ? theme.color.primary100 : theme.color.white)};
  color: ${({ $selected, theme }) => ($selected ? theme.color.primary700 : theme.color.neutral700)};
  font-size: 15px;
  font-weight: ${({ $selected }) => ($selected ? 700 : 600)};
  white-space: nowrap;
  cursor: pointer;

  /* El anillo de foco solo aparece al navegar con teclado, no al hacer clic. */
  &:has(input:focus-visible) {
    outline: ${({ theme }) => theme.focusRing};
    outline-offset: 2px;
  }
`;

type OptionGroupProps<T extends string> = {
  label: string;
  value: T | undefined;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
};

/** Selector de F-03 para hasta 4 opciones: botones de opción con radios nativos (teclado incluido). */
export function OptionGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: OptionGroupProps<T>) {
  const name = useId();
  const labelId = `${name}-label`;

  return (
    <Group role="radiogroup" aria-labelledby={labelId}>
      <Label as="span" id={labelId}>
        {label}
      </Label>
      <Options>
        {options.map(option => {
          const selected = option.value === value;
          return (
            <Option key={option.value} $selected={selected}>
              <input
                type="radio"
                className="visually-hidden"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
              />
              {selected ? <Icon name="check" size={16} strokeWidth={2.6} /> : null}
              {option.label}
            </Option>
          );
        })}
      </Options>
    </Group>
  );
}
