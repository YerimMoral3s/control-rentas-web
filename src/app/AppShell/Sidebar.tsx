import { useLayoutEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import styled from 'styled-components';
import { Icon, Logo } from '@components';
import { LogoutDialog } from '@features/access/LogoutDialog';
import { DESTINATIONS, isActivePath } from '../navigation';
import { media } from '@styles/theme';

const ITEM_HEIGHT = 48;
const ITEM_GAP = 4;

const Aside = styled.nav`
  display: none;

  ${media.desktop} {
    position: sticky;
    top: 0;
    height: 100dvh;
    width: ${({ theme }) => theme.size.sidebar};
    flex: none;
    padding: 24px 12px 12px;
    display: flex;
    flex-direction: column;
    gap: ${ITEM_GAP}px;
    background: ${({ theme }) => theme.color.white};
    border-right: 1px solid ${({ theme }) => theme.color.neutral200};
  }
`;

const LogoSlot = styled.div`
  padding: 0 12px 16px;
  flex: none;
`;

const Items = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: ${ITEM_GAP}px;
`;

const itemStyles = `
  height: ${ITEM_HEIGHT}px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex: none;
  border: 0;
  border-radius: 10px;
  background: transparent;
  text-decoration: none;
  font-size: 15px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
`;

const Item = styled(NavLink)`
  ${itemStyles}
  color: ${({ theme }) => theme.color.neutral700};

  &:hover {
    background: ${({ theme }) => theme.color.neutral100};
    color: ${({ theme }) => theme.color.neutral700};
  }

  &:focus-visible {
    outline-offset: -3px;
  }

  &[aria-current='page'] {
    background: ${({ theme }) => theme.color.primary100};
    color: ${({ theme }) => theme.color.primary700};
    font-weight: 700;
  }
`;

const MoreButton = styled.button<{ $active: boolean }>`
  ${itemStyles}
  width: 100%;
  color: ${({ $active, theme }) => ($active ? theme.color.primary700 : theme.color.neutral700)};
  background: ${({ $active, theme }) => ($active ? theme.color.primary100 : 'transparent')};
  font-weight: ${({ $active }) => ($active ? 700 : 600)};

  &:hover {
    background: ${({ $active, theme }) => ($active ? theme.color.primary100 : theme.color.neutral100)};
  }

  &:focus-visible {
    outline-offset: -3px;
  }
`;

const Footer = styled.div`
  flex: none;
  padding-top: 4px;
  border-top: 1px solid ${({ theme }) => theme.color.neutral200};
`;

const LogoutButton = styled.button`
  ${itemStyles}
  width: 100%;
  color: ${({ theme }) => theme.color.neutral700};

  &:hover {
    background: ${({ theme }) => theme.color.neutral100};
  }

  &:focus-visible {
    outline-offset: -3px;
  }
`;

const MoreWrapper = styled.div`
  position: relative;
  flex: none;
`;

const Menu = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(100% + 4px);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: ${({ theme }) => theme.color.white};
  border: 1px solid ${({ theme }) => theme.color.neutral200};
  border-radius: ${({ theme }) => theme.radius.card};
  box-shadow: 0 12px 24px rgba(16, 24, 40, 0.12);
`;

/**
 * F-10: barra de 224 px. Muestra en orden los destinos que caben; los últimos pasan a Más sin
 * reordenarse. Si la ruta activa está dentro de Más, Más se marca activo y nombra el destino.
 */
export function Sidebar() {
  const { pathname } = useLocation();
  const itemsRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const [visibleCount, setVisibleCount] = useState(DESTINATIONS.length);
  const [logoutOpen, setLogoutOpen] = useState(false);
  // El menú queda ligado a la ruta en que se abrió: al navegar se cierra solo.
  const [menuOpenAt, setMenuOpenAt] = useState<string | null>(null);
  const menuOpen = menuOpenAt === pathname;

  useLayoutEffect(() => {
    const element = itemsRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;

    const measure = () => {
      const fits = Math.floor((element.clientHeight + ITEM_GAP) / (ITEM_HEIGHT + ITEM_GAP));
      const total = DESTINATIONS.length;
      // Si no caben todos, un lugar se reserva para Más.
      setVisibleCount(fits >= total ? total : Math.max(fits - 1, 1));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const visible = DESTINATIONS.slice(0, visibleCount);
  const overflow = DESTINATIONS.slice(visibleCount);
  const activeOverflow = overflow.find(item => isActivePath(pathname, item.path));

  return (
    <Aside aria-label="Navegación principal">
      <LogoSlot>
        <Logo width={134} />
      </LogoSlot>
      <Items ref={itemsRef}>
        {visible.map(item => (
          <Item key={item.path} to={item.path} end={item.path === '/'}>
            <Icon name={item.icon} size={20} />
            {item.label}
          </Item>
        ))}
        {overflow.length > 0 ? (
          <MoreWrapper
            onKeyDown={event => {
              if (event.key === 'Escape' && menuOpen) {
                setMenuOpenAt(null);
                moreButtonRef.current?.focus();
              }
            }}
          >
            {menuOpen ? (
              <Menu>
                {overflow.map(item => (
                  <Item key={item.path} to={item.path}>
                    <Icon name={item.icon} size={20} />
                    {item.label}
                  </Item>
                ))}
              </Menu>
            ) : null}
            <MoreButton
              ref={moreButtonRef}
              type="button"
              $active={Boolean(activeOverflow)}
              aria-haspopup="true"
              aria-expanded={menuOpen}
              aria-current={activeOverflow ? 'page' : undefined}
              onClick={() => setMenuOpenAt(menuOpen ? null : pathname)}
            >
              <Icon name="more" size={20} />
              {activeOverflow ? `Más · ${activeOverflow.label}` : 'Más'}
            </MoreButton>
          </MoreWrapper>
        ) : null}
      </Items>
      {/* Cerrar sesión queda siempre separado de los destinos, al pie de la barra (F-10). */}
      <Footer>
        <LogoutButton type="button" onClick={() => setLogoutOpen(true)}>
          <Icon name="logout" size={20} />
          Cerrar sesión
        </LogoutButton>
      </Footer>
      <LogoutDialog open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </Aside>
  );
}
