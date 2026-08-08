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
import { StammdatenPage } from '@/routes/stammdaten/StammdatenPage';
import { AngeboteListe, AuftraegeListe, LieferscheineListe, RechnungenListe } from '@/routes/belege/BelegeListe';
import { AngebotDetail, AuftragDetail, LieferscheinDetail, RechnungDetail } from '@/routes/belege/BelegDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/artikel" replace />} />
            <Route path="artikel" element={<ArtikelListe />} />
            {/* Bewusst KEINE separate Route "artikel/neu" mehr: die hatte keinen
                :id-Param, wodurch useParams().id in ArtikelDetail bei /artikel/neu
                "undefined" statt "neu" lieferte -> istNeu wurde faelschlich false
                -> ewiges "Laedt..." ohne Request/Fehler (Bug aus session-handoff.md).
                "artikel/:id" matcht /artikel/neu ebenfalls und liefert korrekt id="neu". */}
            <Route path="artikel/:id" element={<ArtikelDetail />} />
            <Route path="kunden" element={<KundenListe />} />
            <Route path="lieferanten" element={<LieferantenListe />} />
            <Route path="lager" element={<LagerUebersicht />} />
            <Route path="bestellungen" element={<BestellungenListe />} />
            <Route path="preise" element={<PreiseUebersicht />} />
            <Route path="zeiterfassung" element={<ZeiterfassungUebersicht />} />
            <Route path="benutzer" element={<BenutzerListe />} />
            <Route path="stammdaten" element={<StammdatenPage />} />
            {/* Gleiches Routing-Muster wie bei Artikel: ":id" matcht auch
                "/xyz/neu", keine separate literale "neu"-Route (siehe Kommentar
                in BelegDetail.tsx bzw. der urspruengliche Bug bei Artikel). */}
            <Route path="angebote" element={<AngeboteListe />} />
            <Route path="angebote/:id" element={<AngebotDetail />} />
            <Route path="auftraege" element={<AuftraegeListe />} />
            <Route path="auftraege/:id" element={<AuftragDetail />} />
            <Route path="lieferscheine" element={<LieferscheineListe />} />
            <Route path="lieferscheine/:id" element={<LieferscheinDetail />} />
            <Route path="rechnungen" element={<RechnungenListe />} />
            <Route path="rechnungen/:id" element={<RechnungDetail />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
