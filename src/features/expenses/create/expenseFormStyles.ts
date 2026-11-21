import styled from 'styled-components';

/** Piezas de los formularios de gasto (E-01, E-02, E-04). */
export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  > span {
    font-size: 15px;
    font-weight: 600;
  }

  small {
    font-size: 13px;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;

export const FieldError = styled.small`
  && {
    color: ${({ theme }) => theme.color.danger};
    font-weight: 600;
  }
`;

export const Picker = styled.button<{ $invalid: boolean }>`
  min-height: ${({ theme }) => theme.size.touch};
  padding: 8px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  border: 1px solid
    ${({ $invalid, theme }) => ($invalid ? theme.color.danger : theme.color.neutral300)};
  border-radius: ${({ theme }) => theme.radius.control};
  background: ${({ theme }) => theme.color.white};
  font: inherit;
  font-size: 15px;
  text-align: left;
  color: ${({ theme }) => theme.color.neutral950};
  cursor: pointer;

  &:focus-visible {
    outline: ${({ theme }) => theme.focusRing};
    outline-offset: 2px;
  }

  span {
    color: ${({ theme }) => theme.color.primary700};
    font-weight: 600;
  }
`;

export const Fixed = styled.div`
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  border-radius: ${({ theme }) => theme.radius.card};
  background: ${({ theme }) => theme.color.neutral50};

  div {
    display: flex;
    flex-direction: column;
  }

  strong {
    font-size: 16px;
  }

  small {
    font-size: 13px;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;

export const Categories = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

export const Category = styled.label<{ $selected: boolean }>`
  position: relative;
  min-height: 44px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  border-radius: ${({ theme }) => theme.radius.control};
  border: 1px solid
    ${({ $selected, theme }) => ($selected ? theme.color.primary600 : theme.color.neutral300)};
  box-shadow: ${({ $selected, theme }) =>
    $selected ? `inset 0 0 0 1px ${theme.color.primary600}` : 'none'};
  background: ${({ $selected, theme }) => ($selected ? theme.color.primary100 : theme.color.white)};
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;

  &:has(input:focus-visible) {
    outline: ${({ theme }) => theme.focusRing};
    outline-offset: 2px;
  }
`;

export const Facts = styled.dl`
  margin: 0;
  padding: 4px 14px;
  border-radius: ${({ theme }) => theme.radius.card};
  background: ${({ theme }) => theme.color.neutral50};

  div {
    padding: 8px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  div + div {
    border-top: 1px solid ${({ theme }) => theme.color.neutral200};
  }

  dt {
    font-size: 15px;
    color: ${({ theme }) => theme.color.neutral600};
  }

  dd {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    text-align: right;
    overflow-wrap: anywhere;
  }
`;

export const List = styled.ul`
  margin: 0;
  padding-left: 20px;
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral700};
`;
