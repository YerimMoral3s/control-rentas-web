import '@fontsource-variable/nunito-sans/opsz.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@app/App';
import { installSessionHandlers } from '@session/session';

installSessionHandlers();

if (import.meta.env.DEV) {
  void import('@session/devTools').then(({ installDevTools }) => installDevTools());
}

const container = document.getElementById('root');
if (!container) throw new Error('No se encontró el contenedor #root');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
