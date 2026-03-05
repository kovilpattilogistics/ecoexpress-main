import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/ecoexpress-water/',
  build: {
    outDir: '../dist/ecoexpress-water',
    emptyOutDir: true,
  },
});