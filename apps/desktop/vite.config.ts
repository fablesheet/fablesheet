import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// @ts-expect-error process is a nodejs global
const env = process.env as Record<string, string | undefined>
const host = env.TAURI_DEV_HOST

/**
 * `FABLESHEET_TARGET=web` builds the installable web app (PWA) for the browser,
 * e.g. on GitHub Pages under `WEB_BASE=/fablesheet/`. Without it, the build is
 * the frontend of the Tauri desktop app.
 */
const web = env.FABLESHEET_TARGET === 'web'

// https://vite.dev/config/
export default defineConfig(async () => ({
  base: web ? (env.WEB_BASE ?? '/') : '/',
  plugins: [
    react(),
    tailwindcss(),
    web &&
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.png', 'apple-touch-icon.png'],
        manifest: {
          name: 'Fablesheet',
          short_name: 'Fablesheet',
          description: 'Offline-first character manager for 5th edition tabletop RPGs',
          lang: 'en',
          display: 'standalone',
          orientation: 'any',
          start_url: '.',
          scope: '.',
          theme_color: '#14110e',
          background_color: '#14110e',
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          // Everything the app needs offline, including the bundled fonts
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        },
      }),
  ],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },
}))
