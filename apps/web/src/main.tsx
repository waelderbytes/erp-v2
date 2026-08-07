// Frontend-Einstieg. UI-Bibliothek: shadcn/ui + Tailwind (Nutzerentscheidung
// 08.08.2026, siehe docs/module-uebersicht.md). Spricht ueber /api/* mit dem
// Backend (siehe apps/web/nginx.conf fuer das Routing zu auth-service/erp-service -
// api-gateway ist aktuell noch ein leerer Stub, siehe docs/CHANGELOG.md).
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
