import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// PWA-Plugin (vite-plugin-pwa) wird aktiviert, sobald die ersten echten Screens
// stehen und ein Icon-Set existiert - reine Konfiguration ohne fertige App bringt
// noch nichts. UI-Bibliothek ist entschieden: shadcn/ui + Tailwind (08.08.2026).
export default defineConfig({
  plugins: [react()],
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
