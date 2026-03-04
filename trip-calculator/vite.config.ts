import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Eco Express Logistics',
        short_name: 'EcoExpress',
        description: 'Sustainable Fleet Management & Logistics',
        theme_color: '#00A651',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],

  base: '/trip-calculator/',

  build: {
    outDir: '../dist/trip-calculator',
    emptyOutDir: true,
  },
  define: {
    // Correctly define the API key from the environment variables
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  }
});