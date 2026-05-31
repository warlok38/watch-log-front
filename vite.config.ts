import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

const projectRoot = path.resolve(__dirname).replace(/^[a-z]:/, (drive) => drive.toUpperCase())

// https://vite.dev/config/
export default defineConfig({
  root: projectRoot,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'WatchLog',
        short_name: 'WatchLog',
        description: 'Личный дневник просмотра сериалов и аниме',
        theme_color: '#1677ff',
        background_color: '#f5f7fb',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: '/pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.tvmaze\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'tvmaze-api',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
          {
            urlPattern: /^https:\/\/api\.jikan\.moe\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'jikan-api',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(projectRoot, './src'),
    },
  },
  test: {
    root: projectRoot,
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
