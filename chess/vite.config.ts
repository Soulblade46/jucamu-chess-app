import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        cleanupOutdatedCaches: true,
      },
      manifest: {
        id: '/',
        name: 'JucamuChessApp',
        short_name: 'JucamuChessApp',
        description: 'Timer scacchi e gestione tornei, anche offline.',
        lang: 'it',
        start_url: '/',
        display: 'standalone',
        theme_color: '#06111f',
        background_color: '#06111f',
        icons: [
          {
            src: '/jucamu_icon.png?v=2',
            sizes: '150x150',
            type: 'image/png',
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
})
