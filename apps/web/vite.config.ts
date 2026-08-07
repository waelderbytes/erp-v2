import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

// PWA-Installierbarkeit (Roadmap-Punkt, Nutzerentscheidung 08.08.2026: generiertes
// Platzhalter-Icon statt eigenem Logo, siehe apps/web/public/icon-*.png). Bewusst
// NUR Installierbarkeit (Manifest + Precaching der Build-Assets fuers App-Shell) -
// KEIN Runtime-Caching von API-Antworten hier, damit z.B. Preise/Bestand nie
// veraltet aus dem Cache angezeigt werden. Echtes Offline-Caching wichtiger Daten
// ist laut architecture.md Abschnitt 2 eine spaetere, separate Ausbaustufe.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'WälderBytes ERP',
        short_name: 'WB ERP',
        description: 'WälderBytes ERP V2 - Auftrags-/Projektverwaltung und Zeiterfassung',
        lang: 'de',
        theme_color: '#1b294b',
        background_color: '#1b294b',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precached wird nur das App-Shell (JS/CSS/HTML/Icons) - siehe Kommentar
        // oben zu bewusst fehlendem API-Runtime-Caching.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    proxy: {
      // Lokale Entwicklung (npm run dev): Backend laeuft nicht im selben Container
      // wie im Produktions-nginx (siehe nginx.conf), deshalb hier ein aequivalenter
      // Proxy fuer `vite dev`.
      // Gleiche Logik wie nginx.conf (Produktion): nur "/api" abschneiden, "/auth"
      // muss erhalten bleiben, siehe Kommentar dort. /benutzer, /rollen ->
      // auth-service (Port 3001), /zeitbuchung -> zeiterfassung-service (Port
      // 3003), alles andere -> erp-service (Port 3002).
      '/api/auth': { target: 'http://localhost:3001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api/, '') },
      '/api/benutzer': { target: 'http://localhost:3001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api/, '') },
      '/api/rollen': { target: 'http://localhost:3001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api/, '') },
      '/api/zeitbuchung': { target: 'http://localhost:3003', changeOrigin: true, rewrite: (p) => p.replace(/^\/api/, '') },
      '/api': { target: 'http://localhost:3002', changeOrigin: true, rewrite: (p) => p.replace(/^\/api/, '') },
    },
  },
});
