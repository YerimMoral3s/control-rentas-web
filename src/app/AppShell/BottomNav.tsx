import { NavLink, useLocation } from 'react-router';
import styled from 'styled-components';
import { Icon } from '@components';
import { MOBILE_MORE, MOBILE_PRIMARY, isActivePath } from '../navigation';
import { media } from '@styles/theme';

const Nav = styled.nav`
  position: fixed;
  inset: auto 0 0;
  z-index: 20;
  height: calc(${({ theme }) => theme.size.bottomNav} + env(safe-area-inset-bottom));
  /* En pantallas anchas (sin llegar a computadora) los destinos no se estiran de más. */
  padding: 0 max(4px, calc((100% - 560px) / 2)) calc(4px + env(safe-area-inset-bottom));
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  column-gap: 2px;
  background: ${({ theme }) => theme.color.white};
  border-top: 1px solid ${({ theme }) => theme.color.neutral200};

  ${media.desktop} {
    display: none;
  }
`;

const Item = styled(NavLink)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border-radius: 12px;
  text-decoration: none;
  color: ${({ theme }) => theme.color.neutral600};
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;

  /* Celulares de menos de 390 px (iPhone SE, Android de 360 px): las etiquetas no se juntan. */
  @media (max-width: 389px) {
    font-size: 11px;
    letter-spacing: -0.1px;
  }

  &:hover {
    color: ${({ theme }) => theme.color.neutral600};
  }

  &:active {
    background: ${({ theme }) => theme.color.neutral100};
    color: ${({ theme }) => theme.color.neutral700};
  }

  &:focus-visible {
    outline-offset: -3px;
  }

  &[aria-current='page'] {
    color: ${({ theme }) => theme.color.primary700};
    font-weight: 800;
  }
`;

const IconSlot = styled.span<{ $active: boolean }>`
  width: 56px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ $active, theme }) => ($active ? theme.color.primary100 : 'transparent')};
  transition: background-color ${({ theme }) => theme.motion.control}
    ${({ theme }) => theme.motion.enter};
`;

/** F-09: cinco destinos con icono y texto; el activo solo cambia fondo, icono y texto. */
export function BottomNav() {
  const { pathname } = useLocation();
  const moreActive =
    pathname === '/mas' || MOBILE_MORE.some(item => isActivePath(pathname, item.path));

  return (
    <Nav aria-label="Navegación principal">
      {MOBILE_PRIMARY.map(item => {
        const active = isActivePath(pathname, item.path);
        return (
          <Item key={item.path} to={item.path} end={item.path === '/'}>
            <IconSlot $active={active}>
              <Icon name={item.icon} size={22} strokeWidth={active ? 2.2 : 2} />
            </IconSlot>
            {item.label}
          </Item>
        );
      })}
      <Item to="/mas" aria-current={moreActive ? 'page' : undefined}>
        <IconSlot $active={moreActive}>
          <Icon name="more" size={22} />
        </IconSlot>
        Más
      </Item>
    </Nav>
  );
}
