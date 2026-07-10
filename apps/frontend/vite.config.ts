import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // .env.local / .env.development viven en apps/frontend/environments,
  // no en la raíz del proyecto (ver carpeta `environments/`).
  envDir: path.resolve(__dirname, './environments'),
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
});
