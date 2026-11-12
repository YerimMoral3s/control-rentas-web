import logoHorizontal from '@assets/brand/rentario-logo-horizontal.svg';

type LogoProps = {
  /** 190 en Acceso móvil, 220 en Acceso computadora, 134 en la barra lateral. */
  width: number;
};

/** Logotipo oficial sin modificar (UI-UX/assets/rentario). */
export function Logo({ width }: LogoProps) {
  return (
    <img
      src={logoHorizontal}
      alt="Rentario"
      width={width}
      height={Math.round((width * 64) / 286)}
      style={{ display: 'block' }}
    />
  );
}
