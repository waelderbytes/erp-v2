import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Login } from '@/routes/Login';
import { Layout } from '@/components/Layout';
import { RequireAuth } from '@/components/RequireAuth';
import { ArtikelListe } from '@/routes/artikel/ArtikelListe';
import { ArtikelDetail } from '@/routes/artikel/ArtikelDetail';
import { KundenListe } from '@/routes/kunden/KundenListe';
import { LieferantenListe } from '@/routes/lieferanten/LieferantenListe';
import { LagerUebersicht } from '@/routes/lager/LagerUebersicht';
import { BestellungenListe } from '@/routes/einkauf/BestellungenListe';
import { PreiseUebersicht } from '@/routes/preise/PreiseUebersicht';
import { BenutzerListe } from '@/routes/benutzer/BenutzerListe';
import { ZeiterfassungUebersicht } from '@/routes/zeiterfassung/ZeiterfassungUebersicht';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/artikel" replace />} />
            <Route path="artikel" element={<ArtikelListe />} />
            <Route path="artikel/:id" element={<ArtikelDetail />} />
            <Route path="kunden" element={<KundenListe />} />
            <Route path="lieferanten" element={<LieferantenListe />} />
            <Route path="lager" element={<LagerUebersicht />} />
            <Route path="bestellungen" element={<BestellungenListe />} />
            <Route path="preise" element={<PreiseUebersicht />} />
            <Route path="zeiterfassung" element={<ZeiterfassungUebersicht />} />
            <Route path="benutzer" element={<BenutzerListe />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
