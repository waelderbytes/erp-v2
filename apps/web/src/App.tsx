import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Login } from '@/routes/Login';
import { Layout } from '@/components/Layout';
import { RequireAuth } from '@/components/RequireAuth';
import { ArtikelListe } from '@/routes/artikel/ArtikelListe';
import { KundenListe } from '@/routes/kunden/KundenListe';
import { LieferantenListe } from '@/routes/lieferanten/LieferantenListe';
import { LagerUebersicht } from '@/routes/lager/LagerUebersicht';
import { BestellungenListe } from '@/routes/einkauf/BestellungenListe';
import { PreiseUebersicht } from '@/routes/preise/PreiseUebersicht';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/artikel" replace />} />
            <Route path="artikel" element={<ArtikelListe />} />
            <Route path="kunden" element={<KundenListe />} />
            <Route path="lieferanten" element={<LieferantenListe />} />
            <Route path="lager" element={<LagerUebersicht />} />
            <Route path="bestellungen" element={<BestellungenListe />} />
            <Route path="preise" element={<PreiseUebersicht />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
