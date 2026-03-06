import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
  },
  preview: {
    port: parseInt(process.env.PORT) || 8080,
    host: '0.0.0.0',
  },
});
