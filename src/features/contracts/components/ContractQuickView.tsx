import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import styled from 'styled-components';
import type { Contract } from '@api/contracts';
import { ContractMark, FROM_LIST_STATE, Icon, StatusBadge } from '@components';
import { placeName } from '@lib/place';
import { contractDatesLine } from '../contractText';
import { ContractSummaryBlocks } from './ContractSummary';

const Aside = styled.aside`
  width: 400px;
  flex: none;
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.color.white};
  border: 1px solid ${({ theme }) => theme.color.neutral200};
  border-radius: ${({ theme }) => theme.radius.panel};
  box-shadow: 0 12px 32px rgba(16, 24, 40, 0.1);
`;

const Head = styled.div`
  padding: 16px 12px 12px 20px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  border-bottom: 1px solid ${({ theme }) => theme.color.neutral200};
`;

const HeadText = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;

  h2 {
    margin: 0;
    font-size: 20px;
    line-height: 26px;
  }

  > span {
    font-size: 13px;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;

const Badges = styled.span`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const Close = styled.button`
  width: 44px;
  height: 44px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: ${({ theme }) => theme.radius.control};
  background: transparent;
  color: ${({ theme }) => theme.color.neutral600};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.color.neutral100};
  }
`;

const Body = styled.div`
  padding: 16px 20px;
`;

const Foot = styled.div`
  padding: 12px 20px 16px;
  border-top: 1px solid ${({ theme }) => theme.color.neutral200};
`;

const DetailLink = styled(Link)`
  height: ${({ theme }) => theme.size.touchPrimary};
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ theme }) => theme.color.primaryBorder};
  border-radius: ${({ theme }) => theme.radius.control};
  background: ${({ theme }) => theme.color.primary100};
  color: ${({ theme }) => theme.color.primary700};
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;

  &:hover {
    background: ${({ theme }) => theme.color.primaryPressed};
  }
`;

/** C-02: vista rápida de contrato en computadora. Esc o la X la cierran. */
export function ContractQuickView({
  contract,
  onClose,
}: {
  contract: Contract;
  onClose: () => void;
}) {
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const name = `${contract.tenant.first_name} ${contract.tenant.last_name}`;

  return (
    <Aside aria-label={`Vista rápida del contrato de ${name}`}>
      <Head>
        <HeadText>
          <h2>{name}</h2>
          <span>{placeName(contract.unit.name, contract.property)}</span>
          <Badges>
            <StatusBadge status={contract.status} compact />
            <ContractMark current={contract.is_current} />
          </Badges>
          <span>{contractDatesLine(contract)}</span>
        </HeadText>
        <Close type="button" aria-label="Cerrar vista rápida" onClick={onClose}>
          <Icon name="close" size={20} strokeWidth={2.2} />
        </Close>
      </Head>
      <Body>
        <ContractSummaryBlocks contract={contract} compact />
      </Body>
      <Foot>
        <DetailLink to={`/contratos/${contract.id}`} state={FROM_LIST_STATE}>
          Ver detalle
        </DetailLink>
      </Foot>
    </Aside>
  );
}
