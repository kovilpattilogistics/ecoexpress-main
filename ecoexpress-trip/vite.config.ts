import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/ecoexpress-trip/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: '../dist/ecoexpress-trip',
    emptyOutDir: true,
  },
  define: {
    // Correctly define the API key from the environment variables
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  }
});