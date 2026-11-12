import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@api': fromRoot('./src/api'),
      '@app': fromRoot('./src/app'),
      '@assets': fromRoot('./src/assets'),
      '@components': fromRoot('./src/components'),
      '@features': fromRoot('./src/features'),
      '@hooks': fromRoot('./src/hooks'),
      '@lib': fromRoot('./src/lib'),
      '@stores': fromRoot('./src/stores'),
      '@styles': fromRoot('./src/styles'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    // Opcional en desarrollo: con VITE_API_BASE_URL=/v1 las peticiones salen por el mismo origen.
    proxy: { '/v1': 'http://localhost:3000' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    restoreMocks: true,
  },
});
