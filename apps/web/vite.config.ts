import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// PWA-Plugin-Konfiguration folgt, sobald die UI-Komponenten-Bibliothek entschieden
// ist (siehe docs/architecture.md Abschnitt 9, Offene Punkte) - erstmal reine
// React-App als Build-Nachweis.
export default defineConfig({
  plugins: [react()],
});
