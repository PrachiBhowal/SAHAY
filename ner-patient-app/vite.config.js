import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true }, // lets you test SW in dev mode
      manifest: {
        name: 'NER Cognitive Care',
        short_name: 'CareApp',
        theme_color: '#C77B4F', // --color-terracotta from CONTRACTS.md
        background_color: '#FAF6F0', // --color-background
        display: 'standalone',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        // offline caching strategy, not sync logic - that's Day 4
        runtimeCaching: [
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|mp3|wav)$/,
            handler: 'CacheFirst',
            options: { cacheName: 'media-cache' }
          }
        ]
      }
    })
  ]
})