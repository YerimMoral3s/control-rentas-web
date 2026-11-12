import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; }

  html { -webkit-text-size-adjust: 100%; }

  body {
    margin: 0;
    background: ${({ theme }) => theme.color.neutral50};
    color: ${({ theme }) => theme.color.neutral950};
    font-family: ${({ theme }) => theme.font.family};
    font-size: ${({ theme }) => theme.text.body.size};
    line-height: ${({ theme }) => theme.text.body.line};
    font-variant-numeric: tabular-nums;
    -webkit-font-smoothing: antialiased;
  }

  button, input, select, textarea { font: inherit; color: inherit; }

  a { color: ${({ theme }) => theme.color.primary600}; }
  a:hover { color: ${({ theme }) => theme.color.primary700}; }

  :focus-visible {
    outline: ${({ theme }) => theme.focusRing};
    outline-offset: 2px;
  }

  .visually-hidden {
    position: absolute !important;
    width: 1px; height: 1px;
    margin: -1px; padding: 0;
    overflow: hidden; clip: rect(0 0 0 0);
    white-space: nowrap; border: 0;
  }

  /* F-11: con movimiento reducido solo quedan fundidos breves o cambios inmediatos. */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      scroll-behavior: auto !important;
      transition-duration: ${({ theme }) => theme.motion.reduced} !important;
      transition-property: opacity, background-color, color, border-color !important;
    }
  }
`;
