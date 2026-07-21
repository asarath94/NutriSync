import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Auto-refreshes the SW on new deploys - no in-app "update available"
      // prompt UI exists (or is planned yet), so autoUpdate needs no wiring.
      registerType: 'autoUpdate',
      // Service worker registration is only injected into the production
      // build's index.html; dev mode is unaffected unless devOptions.enabled
      // is set (it isn't), which is the plugin's default.
      manifest: {
        name: 'NutriSync',
        short_name: 'NutriSync',
        // Placeholder colors - no branding decided yet, swap when it is.
        theme_color: '#16a34a',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
})
