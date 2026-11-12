import { useId, useRef } from 'react';
import styled from 'styled-components';
import { Icon } from '../Icon';
import { Control, Input } from '../TextField/styles';

const SearchControl = styled(Control)`
  padding-right: 4px;
  color: ${({ theme }) => theme.color.neutral600};

  input {
    color: ${({ theme }) => theme.color.neutral950};
  }

  input::placeholder {
    color: ${({ theme }) => theme.color.neutral500};
  }

  /* El navegador agrega su propia "x" en type="search"; se usa solo la de F-03. */
  input::-webkit-search-cancel-button,
  input::-webkit-search-decoration {
    -webkit-appearance: none;
    appearance: none;
  }
`;

const ClearButton = styled.button`
  width: 44px;
  height: 44px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: ${({ theme }) => theme.color.neutral600};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.color.neutral100};
  }
`;

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  /** Nombre accesible con todos los criterios, por ejemplo "Buscar por inquilino, teléfono, propiedad, unidad o concepto". */
  label: string;
  placeholder: string;
};

/**
 * Buscador de F-03. Solo controla el texto: quien lo usa aplica `useDebounce` antes de consultar.
 * Limpiar aparece únicamente con texto y devuelve el foco al campo.
 */
export function SearchField({ value, onChange, label, placeholder }: SearchFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <SearchControl>
      <Icon name="search" size={20} />
      <label htmlFor={inputId} className="visually-hidden">
        {label}
      </label>
      <Input
        ref={inputRef}
        id={inputId}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
      />
      {value ? (
        <ClearButton
          type="button"
          aria-label="Limpiar búsqueda"
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
        >
          <Icon name="close" size={18} strokeWidth={2.2} />
        </ClearButton>
      ) : null}
    </SearchControl>
  );
}
