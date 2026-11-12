/**
 * Tokens del Sistema Visual de Rentario (UI-UX/Sistema_Visual_Control_Rentas.md y F-01).
 * No inventar colores ni tamaños aquí: si falta uno, sale de la entrega de UI/UX.
 */
export const theme = {
  color: {
    primary700: '#163A8C',
    primary600: '#2452C8',
    primary100: '#EAF0FF',
    primary50: '#F4F7FF',
    primaryBorder: '#C9D6FB',
    primaryBorderStrong: '#B3C5F7',
    primaryPressed: '#DCE6FF',
    neutral950: '#101828',
    neutral700: '#344054',
    neutral600: '#475467',
    neutral500: '#667085',
    neutral400: '#98A2B3',
    neutral300: '#D0D5DD',
    neutral200: '#E4E7EC',
    neutral100: '#F2F4F7',
    neutral50: '#F8F9FC',
    white: '#FFFFFF',
    success: '#067647',
    successBg: '#ECFDF3',
    successBorder: '#ABEFC6',
    warning: '#B54708',
    warningBg: '#FFF7E6',
    warningBar: '#DC6803',
    warningBorder: '#FEDF89',
    danger: '#B42318',
    dangerPressed: '#912018',
    dangerBg: '#FEF3F2',
    dangerBorder: '#FECDCA',
    dangerStripe: '#F9C5C0',
    info: '#175CD3',
    infoBg: '#EFF8FF',
    infoBorder: '#B2DDFF',
    muted: '#475467',
    mutedBg: '#F2F4F7',
  },
  font: {
    family:
      "'Nunito Sans Variable', 'Nunito Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  text: {
    page: { size: '28px', line: '34px', weight: 700 },
    section: { size: '20px', line: '26px', weight: 700 },
    card: { size: '16px', line: '22px', weight: 700 },
    body: { size: '15px', line: '22px', weight: 400 },
    bodyStrong: { size: '15px', line: '22px', weight: 600 },
    aux: { size: '13px', line: '18px', weight: 400 },
    amount: { size: '24px', line: '30px', weight: 700 },
    amountRow: { size: '16px', line: '22px', weight: 700 },
  },
  space: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48] as const,
  radius: { control: '10px', card: '14px', panel: '18px', pill: '999px' },
  size: {
    touch: '44px',
    touchPrimary: '48px',
    field: '48px',
    sidebar: '224px',
    contentMax: '1280px',
    bottomNav: '72px',
    topBar: '56px',
    dialog: '480px',
    panel: '440px',
  },
  motion: {
    enter: 'cubic-bezier(0.2, 0, 0, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
    control: '140ms',
    revealIn: '200ms',
    revealOut: '160ms',
    layerIn: '240ms',
    layerOut: '180ms',
    reduced: '80ms',
  },
  breakpoint: {
    /** Composición de computadora: barra lateral y vistas rápidas. */
    desktop: '1024px',
  },
  focusRing: '3px solid #2452C8',
} as const;

export type AppTheme = typeof theme;

export const media = {
  desktop: `@media (min-width: ${theme.breakpoint.desktop})`,
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
} as const;
