import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchCreateDropdown } from '@/components/ui/search-create-dropdown';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Artikel,
  ArtikelLieferant,
  ArtikelLog,
  ArtikelUebersetzung,
  Artikelart,
  Artikelpreis,
  Benutzer,
  Einheit,
  Kunde,
  Lager,
  Lagerbestand,
  Lieferant,
  Steuersatz,
  StuecklisteKnoten,
  StuecklistePosition,
} from '@/lib/types';

// Ein Screen fuer Anlegen UND Bearbeiten (Route "/artikel/neu" bzw. "/artikel/:id"),
// nach dem Muster aus ERP v1 (waelderbytes-suite, ArtikelWizard.tsx): der erste
// Tab "Stammdaten" speichert den Artikel, danach schalten sich die weiteren Tabs
// (Bestand/Preise/Lieferanten/Sprachen) frei - kein separater Anlegen-Dialog mehr.
//
// UX-Entscheidung (08.08.2026): Tabs sind von Anfang an ALLE sichtbar (nicht erst
// nach dem Speichern eingeblendet), aber gesperrt (disabled + Tooltip), solange kein
// Artikel existiert - technisch zwingend, da Preise/Lieferanten-Zuordnung/Sprachen/
// Bestand eigene Tabellen mit artikel_id als Fremdschluessel sind, Bestand zusaetzlich
// eine echte, race-condition-gesicherte Lagerbuchung (siehe architecture.md) und daher
// kein reiner "Entwurf" sein kann. Zusaetzlich Weiter/Zurueck-Buttons unterhalb der
// Tabs fuer eine gefuehrte Assistenten-Optik; nach dem ersten Speichern der
// Stammdaten springt die Ansicht automatisch zum naechsten Tab.
interface ArtikelTabDef {
  value: string;
  label: string;
  deaktiviert: boolean;
  tooltip?: string;
}

export function ArtikelDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const istNeu = id === 'neu';
  const [artikel, setArtikel] = useState<Artikel | null>(null);
  const [ladeFehler, setLadeFehler] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('stammdaten');

  async function laden() {
    if (!id || istNeu) return;
    try {
      setArtikel(await api.get<Artikel>(`/artikel/${id}`));
    } catch (err) {
      setLadeFehler(err instanceof ApiError ? err.message : 'Artikel konnte nicht geladen werden.');
    }
  }

  useEffect(() => {
    laden();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (ladeFehler) {
    return <p className="text-sm text-destructive">{ladeFehler}</p>;
  }
  if (!istNeu && !artikel) {
    return <p className="text-sm text-muted-foreground">Lädt…</p>;
  }

  const stammdatenNichtGespeichert = 'Bitte zuerst Stammdaten speichern';

  // "Bestand" ist jetzt IMMER in der Liste (Roadmap-Punkt "Bestand-Tab immer
  // sichtbar"), nur ausgegraut wenn nicht bestandsgefuehrt - vorher wurde der
  // Tab bei nicht bestandsgefuehrten Artikeln (z.B. Dienstleistung) komplett
  // ausgeblendet.
  const tabs: ArtikelTabDef[] = [
    { value: 'stammdaten', label: 'Stammdaten', deaktiviert: false },
    {
      value: 'bestand',
      label: 'Bestand',
      deaktiviert: !artikel || !artikel.bestandsgefuehrt,
      tooltip: !artikel ? stammdatenNichtGespeichert : !artikel.bestandsgefuehrt ? 'Artikel ist nicht bestandsgeführt' : undefined,
    },
    { value: 'preise', label: 'Preise', deaktiviert: !artikel, tooltip: !artikel ? stammdatenNichtGespeichert : undefined },
    {
      value: 'lieferanten',
      label: 'Lieferanten',
      deaktiviert: !artikel,
      tooltip: !artikel ? stammdatenNichtGespeichert : undefined,
    },
    { value: 'sprachen', label: 'Sprachen', deaktiviert: !artikel, tooltip: !artikel ? stammdatenNichtGespeichert : undefined },
    {
      value: 'stueckliste',
      label: 'Stückliste',
      deaktiviert: !artikel || !artikel.bomfaehig,
      tooltip: !artikel ? stammdatenNichtGespeichert : !artikel.bomfaehig ? 'Artikel ist nicht stücklistenfähig' : undefined,
    },
    { value: 'log', label: 'Log', deaktiviert: !artikel, tooltip: !artikel ? stammdatenNichtGespeichert : undefined },
  ];

  const aktuellerIndex = tabs.findIndex((t) => t.value === activeTab);
  // Ueberspringt deaktivierte Tabs (z.B. "Bestand" bei einer Dienstleistung),
  // statt den Nutzer mit Weiter/Zurueck auf einem gesperrten Tab landen zu lassen.
  function naechsterAktiverTab(vonIndex: number, richtung: 1 | -1): ArtikelTabDef | undefined {
    for (let i = vonIndex + richtung; i >= 0 && i < tabs.length; i += richtung) {
      if (!tabs[i].deaktiviert) return tabs[i];
    }
    return undefined;
  }
  const vorherigerTab = naechsterAktiverTab(aktuellerIndex, -1);
  const naechsterTab = naechsterAktiverTab(aktuellerIndex, 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/artikel')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          {artikel && <div className="font-mono text-xs text-muted-foreground">{artikel.artikelnummer}</div>}
          <h1 className="text-xl font-semibold">{istNeu ? 'Neuer Artikel' : artikel!.bezeichnung}</h1>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value} disabled={t.deaktiviert} title={t.tooltip}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="stammdaten">
          <StammdatenTab
            artikel={artikel}
            onGespeichert={(a, warNeu) => {
              setArtikel(a);
              // Nach dem ERSTEN Speichern (Anlegen) auf die echte URL wechseln,
              // damit ein Reload nicht wieder im "neu"-Modus landet und die
              // anderen Tabs (die eine echte artikelId brauchen) sofort nutzbar sind.
              if (warNeu) {
                navigate(`/artikel/${a.id}`, { replace: true });
                // Gefuehrter Assistent: automatisch zum naechsten Tab springen,
                // statt den Nutzer manuell klicken zu lassen.
                setActiveTab(a.bestandsgefuehrt ? 'bestand' : 'preise');
              }
            }}
          />
        </TabsContent>
        {artikel?.bestandsgefuehrt && (
          <TabsContent value="bestand">
            <BestandTab artikelId={artikel.id} />
          </TabsContent>
        )}
        {artikel && (
          <TabsContent value="preise">
            <PreiseTab artikelId={artikel.id} />
          </TabsContent>
        )}
        {artikel && (
          <TabsContent value="lieferanten">
            <LieferantenTab artikelId={artikel.id} />
          </TabsContent>
        )}
        {artikel && (
          <TabsContent value="sprachen">
            <SprachenTab artikelId={artikel.id} />
          </TabsContent>
        )}
        {artikel?.bomfaehig && (
          <TabsContent value="stueckliste">
            <StuecklisteTab artikel={artikel} />
          </TabsContent>
        )}
        {artikel && (
          <TabsContent value="log">
            <LogTab artikelId={artikel.id} />
          </TabsContent>
        )}
      </Tabs>

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          disabled={!vorherigerTab}
          onClick={() => vorherigerTab && setActiveTab(vorherigerTab.value)}
        >
          Zurück
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!naechsterTab}
          onClick={() => naechsterTab && setActiveTab(naechsterTab.value)}
        >
          Weiter
        </Button>
      </div>
    </div>
  );
}
function StammdatenTab({
  artikel,
  onGespeichert,
}: {
  artikel: Artikel | null;
  onGespeichert: (a: Artikel, warNeu: boolean) => void;
}) {
  const [artikelart, setArtikelart] = useState<Artikelart>(artikel?.artikelart ?? 'handelsware');
  const [bezeichnung, setBezeichnung] = useState(artikel?.bezeichnung ?? '');
  const [beschreibung, setBeschreibung] = useState(artikel?.beschreibung ?? '');
  const [einheitId, setEinheitId] = useState<string | null>(artikel?.einheitId ?? null);
  const [steuersatzId, setSteuersatzId] = useState<string>(artikel?.steuersatzId ?? '');
  const [eanGtin, setEanGtin] = useState(artikel?.eanGtin ?? '');
  const [hersteller, setHersteller] = useState(artikel?.hersteller ?? '');
  const [herstellerArtikelnummer, setHerstellerArtikelnummer] = useState(artikel?.herstellerArtikelnummer ?? '');
  const [interneNotiz, setInterneNotiz] = useState(artikel?.interneNotiz ?? '');
  const [bestandsgefuehrt, setBestandsgefuehrt] = useState(artikel?.bestandsgefuehrt ?? false);
  const [bomfaehig, setBomfaehig] = useState(artikel?.bomfaehig ?? false);
  const [gewichtKg, setGewichtKg] = useState(artikel?.gewichtKg ?? '');
  const [laengeMm, setLaengeMm] = useState(artikel?.laengeMm ?? '');
  const [breiteMm, setBreiteMm] = useState(artikel?.breiteMm ?? '');
  const [hoeheMm, setHoeheMm] = useState(artikel?.hoeheMm ?? '');
  const [mindestbestand, setMindestbestand] = useState(artikel?.mindestbestand ?? '');
  const [aktiv, setAktiv] = useState(artikel?.aktiv ?? true);
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState(false);
  const [speichernd, setSpeichernd] = useState(false);

  // Einheiten-Dropdown (Nutzerentscheidung 08.08.2026: echtes Modul statt
  // statischer Liste, siehe docs/CHANGELOG.md). SearchCreateDropdown 1:1 nach
  // dem Vorbild aus ERP v1 uebernommen - tippen filtert, "+ anlegen" oeffnet
  // das kleine Popup fuer Code/Name/Nachkommastellen.
  const [einheiten, setEinheiten] = useState<Einheit[]>([]);
  const [neueEinheitEingabe, setNeueEinheitEingabe] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Einheit[]>('/einheiten')
      .then(setEinheiten)
      .catch(() => undefined);
  }, []);

  // Steuersaetze (Modul Stammdaten/System-Einstellungen) - beim Neuanlegen
  // wird der Standard-Steuersatz (i.d.R. 19%) vorbelegt, damit das Feld
  // nicht leer als Pflichtfeld blockiert (siehe feldkatalog.md).
  const [steuersaetze, setSteuersaetze] = useState<Steuersatz[]>([]);

  useEffect(() => {
    api
      .get<Steuersatz[]>('/steuersaetze')
      .then((liste) => {
        setSteuersaetze(liste);
        if (!artikel) {
          const standard = liste.find((s) => s.istStandard);
          if (standard) setSteuersatzId(standard.id);
        }
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const steuersatzOptionen = steuersaetze.filter((s) => s.aktiv || s.id === steuersatzId);

  // Aktuell zugewiesene Einheit bleibt auch dann in der Liste, wenn sie
  // inzwischen deaktiviert wurde - sonst wuerde einheitId bei bestehenden
  // Artikeln ploetzlich "leer" angezeigt (gleiches Muster wie in v1).
  const einheitOptionen = einheiten
    .filter((e) => e.aktiv || e.id === einheitId)
    .map((e) => ({ id: e.id, label: `${e.code} – ${e.name}` }));

  async function einheitAnlegen(code: string, name: string, dezimalstellen: number) {
    const neu = await api.post<Einheit>('/einheiten', { code, name, dezimalstellen });
    setEinheiten((liste) => [...liste, neu]);
    setEinheitId(neu.id);
    setNeueEinheitEingabe(null);
  }

  async function einheitDeaktivieren(id: string) {
    try {
      await api.delete(`/einheiten/${id}`);
      setEinheiten((liste) => liste.map((e) => (e.id === id ? { ...e, aktiv: false } : e)));
    } catch {
      setFehler('Einheit konnte nicht deaktiviert werden.');
    }
  }

  // Kurztext-Vorschlaege aus vorhandenen Artikeln (Nutzerwunsch 08.08.2026:
  // Tippen soll auf ggf. bereits existierende, aehnlich benannte Artikel
  // hinweisen - Duplikat-Vermeidung). Nur beim Neuanlegen relevant, laedt die
  // Liste einmalig (nutzt die ohnehin vorhandene GET /artikel, kein neuer
  // Backend-Endpoint noetig). Klick auf einen Vorschlag ist nur ein Hinweis,
  // keine Pflichtauswahl - Kurztext bleibt Freitext.
  const [artikelVorschlaege, setArtikelVorschlaege] = useState<Artikel[]>([]);
  const [bezeichnungFokussiert, setBezeichnungFokussiert] = useState(false);

  useEffect(() => {
    if (artikel) return; // nur beim Neuanlegen relevant
    api
      .get<Artikel[]>('/artikel')
      .then(setArtikelVorschlaege)
      .catch(() => undefined);
  }, [artikel]);

  const bezeichnungTreffer =
    !artikel && bezeichnung.trim().length >= 2
      ? artikelVorschlaege
          .filter((a) => a.bezeichnung.toLowerCase().includes(bezeichnung.trim().toLowerCase()))
          .slice(0, 8)
      : [];

  async function speichern(e: FormEvent) {
    e.preventDefault();
    setFehler(null);
    setErfolg(false);
    if (!steuersatzId) {
      setFehler('Bitte einen Steuersatz auswählen.');
      return;
    }
    setSpeichernd(true);
    try {
      if (!artikel) {
        const neuer = await api.post<Artikel>('/artikel', {
          artikelart,
          bezeichnung,
          beschreibung: beschreibung || undefined,
          einheitId: einheitId || undefined,
          steuersatzId,
          eanGtin: eanGtin || undefined,
          bestandsgefuehrt: artikelart === 'dienstleistung' ? undefined : bestandsgefuehrt,
          bomfaehig: artikelart === 'fertigungsartikel' ? bomfaehig : undefined,
          hersteller: hersteller || undefined,
          herstellerArtikelnummer: herstellerArtikelnummer || undefined,
          interneNotiz: interneNotiz || undefined,
          gewichtKg: gewichtKg || undefined,
          laengeMm: laengeMm || undefined,
          breiteMm: breiteMm || undefined,
          hoeheMm: hoeheMm || undefined,
          mindestbestand: mindestbestand || undefined,
        });
        onGespeichert(neuer, true);
      } else {
        const aktualisiert = await api.patch<Artikel>(`/artikel/${artikel.id}`, {
          bezeichnung,
          beschreibung: beschreibung || undefined,
          einheitId: einheitId || undefined,
          steuersatzId,
          eanGtin: eanGtin || undefined,
          hersteller: hersteller || undefined,
          herstellerArtikelnummer: herstellerArtikelnummer || undefined,
          interneNotiz: interneNotiz || undefined,
          bestandsgefuehrt,
          bomfaehig,
          gewichtKg: gewichtKg || undefined,
          laengeMm: laengeMm || undefined,
          breiteMm: breiteMm || undefined,
          hoeheMm: hoeheMm || undefined,
          mindestbestand: mindestbestand || undefined,
          aktiv,
        });
        onGespeichert(aktualisiert, false);
      }
      setErfolg(true);
    } catch (err) {
      setFehler(err instanceof ApiError ? err.message : 'Speichern fehlgeschlagen.');
    } finally {
      setSpeichernd(false);
    }
  }

  return (
    <Card className="max-w-xl">
      <CardContent className="pt-6">
        <form onSubmit={speichern} className="space-y-4">
          {!artikel && (
            <div className="space-y-1.5">
              <Label htmlFor="artikelart">Artikelart</Label>
              <Select value={artikelart} onValueChange={(v) => setArtikelart(v as Artikelart)}>
                <SelectTrigger id="artikelart">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="handelsware">Handelsware</SelectItem>
                  <SelectItem value="dienstleistung">Dienstleistung</SelectItem>
                  <SelectItem value="fertigungsartikel">Fertigungsartikel</SelectItem>
                </SelectContent>
              </Select>
              {/* Nach dem Anlegen nicht mehr aenderbar - siehe
                  ArtikelAktualisierenDto-Kommentar im Backend. */}
            </div>
          )}
          <div className="relative space-y-1.5">
            <Label htmlFor="bezeichnung">Kurztext (Bezeichnung, Deutsch)</Label>
            <Input
              id="bezeichnung"
              value={bezeichnung}
              onChange={(e) => setBezeichnung(e.target.value)}
              onFocus={() => setBezeichnungFokussiert(true)}
              onBlur={() => setTimeout(() => setBezeichnungFokussiert(false), 150)}
              required
              autoFocus
              autoComplete="off"
            />
            {bezeichnungFokussiert && bezeichnungTreffer.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-auto rounded-md border border-border bg-popover bg-background shadow-md">
                <p className="border-b border-border px-2 py-1 text-xs text-muted-foreground">
                  Ähnliche vorhandene Artikel:
                </p>
                {bezeichnungTreffer.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setBezeichnung(a.bezeichnung)}
                    className="flex w-full items-center justify-between px-2 py-1.5 text-left text-sm hover:bg-accent"
                  >
                    <span className="truncate">{a.bezeichnung}</span>
                    <span className="ml-2 shrink-0 font-mono text-xs text-muted-foreground">{a.artikelnummer}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="beschreibung">Langtext (Beschreibung, Deutsch)</Label>
            <textarea
              id="beschreibung"
              value={beschreibung}
              onChange={(e) => setBeschreibung(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              Weitere Sprachen für Kurz-/Langtext lassen sich nach dem Speichern im Tab „Sprachen“ hinterlegen.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative space-y-1.5">
              <Label htmlFor="einheit">Einheit</Label>
              <SearchCreateDropdown
                value={einheitId}
                options={einheitOptionen}
                placeholder="Suchen/anlegen…"
                onSelect={setEinheitId}
                onCreateRequest={(eingabe) => setNeueEinheitEingabe(eingabe)}
                onDeactivate={einheitDeaktivieren}
              />
              {neueEinheitEingabe !== null && (
                <EinheitAnlegenPopover
                  vorschlagName={neueEinheitEingabe}
                  onCancel={() => setNeueEinheitEingabe(null)}
                  onCreate={einheitAnlegen}
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eanGtin">EAN/GTIN</Label>
              <Input id="eanGtin" value={eanGtin} onChange={(e) => setEanGtin(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="steuersatz">Steuersatz</Label>
            <Select value={steuersatzId} onValueChange={setSteuersatzId}>
              <SelectTrigger id="steuersatz">
                <SelectValue placeholder="Steuersatz wählen…" />
              </SelectTrigger>
              <SelectContent>
                {steuersatzOptionen.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.bezeichnung} ({s.satz}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {artikelart !== 'dienstleistung' && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={bestandsgefuehrt} onChange={(e) => setBestandsgefuehrt(e.target.checked)} />
              Bestandsgeführt
            </label>
          )}
          {bestandsgefuehrt && (
            <div className="space-y-1.5">
              <Label htmlFor="mindestbestand">Mindestbestand</Label>
              <Input
                id="mindestbestand"
                value={mindestbestand}
                onChange={(e) => setMindestbestand(e.target.value)}
                placeholder="z. B. 10"
              />
            </div>
          )}
          {artikelart === 'fertigungsartikel' && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={bomfaehig} onChange={(e) => setBomfaehig(e.target.checked)} />
              Stücklistenfähig
            </label>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="hersteller">Hersteller</Label>
              <Input id="hersteller" value={hersteller} onChange={(e) => setHersteller(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="herstellerArtikelnummer">Hersteller-Art.-Nr.</Label>
              <Input
                id="herstellerArtikelnummer"
                value={herstellerArtikelnummer}
                onChange={(e) => setHerstellerArtikelnummer(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="gewichtKg">Gewicht (kg)</Label>
              <Input id="gewichtKg" value={gewichtKg} onChange={(e) => setGewichtKg(e.target.value)} placeholder="z. B. 2.5" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="laengeMm">Länge (mm)</Label>
              <Input id="laengeMm" value={laengeMm} onChange={(e) => setLaengeMm(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="breiteMm">Breite (mm)</Label>
              <Input id="breiteMm" value={breiteMm} onChange={(e) => setBreiteMm(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hoeheMm">Höhe (mm)</Label>
              <Input id="hoeheMm" value={hoeheMm} onChange={(e) => setHoeheMm(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="interneNotiz">Interne Notiz</Label>
            <textarea
              id="interneNotiz"
              value={interneNotiz}
              onChange={(e) => setInterneNotiz(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground">Nur intern sichtbar, erscheint nie auf Belegen.</p>
          </div>
          {artikel && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={aktiv} onChange={(e) => setAktiv(e.target.checked)} />
              Aktiv
            </label>
          )}
          {fehler && <p className="text-sm text-destructive">{fehler}</p>}
          {erfolg && <p className="text-sm text-primary">Gespeichert.</p>}
          <Button type="submit" disabled={speichernd}>
            {speichernd ? 'Speichert…' : artikel ? 'Speichern' : 'Anlegen'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Kleines Anlegen-Popup fuer neue Einheiten direkt aus dem Dropdown heraus,
// 1:1 nach dem Vorbild aus ERP v1 (EinheitDialog.tsx) - fragt zusaetzlich die
// Nachkommastellen ab ("0,0005/Stück macht keinen Sinn"), Default 2.
function EinheitAnlegenPopover({
  vorschlagName,
  onCancel,
  onCreate,
}: {
  vorschlagName: string;
  onCancel: () => void;
  onCreate: (code: string, name: string, dezimalstellen: number) => Promise<void>;
}) {
  const [code, setCode] = useState('');
  const [name, setName] = useState(vorschlagName);
  const [dezimalstellen, setDezimalstellen] = useState('2');
  const [speichernd, setSpeichernd] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function anlegen() {
    if (!code.trim() || !name.trim()) return;
    setSpeichernd(true);
    setFehler(null);
    try {
      await onCreate(code.trim(), name.trim(), Math.max(0, Math.min(6, parseInt(dezimalstellen, 10) || 0)));
    } catch (err) {
      setFehler(err instanceof ApiError ? err.message : 'Anlegen fehlgeschlagen.');
    } finally {
      setSpeichernd(false);
    }
  }

  return (
    <div
      className="absolute left-0 top-full z-50 mt-1 w-72 space-y-2 rounded-md border border-border bg-popover bg-background p-3 shadow-md"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <p className="text-xs font-semibold">Neue Einheit</p>
      <div className="space-y-1">
        <Label className="text-xs">Code (z. B. „Stk“, „Std“, „kg“)</Label>
        <Input value={code} maxLength={10} onChange={(e) => setCode(e.target.value)} autoFocus />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Bezeichnung</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Nachkommastellen (0 = ganzzahlig, z. B. Stück)</Label>
        <Input
          type="number"
          min={0}
          max={6}
          value={dezimalstellen}
          onChange={(e) => setDezimalstellen(e.target.value)}
        />
      </div>
      {fehler && <p className="text-xs text-destructive">{fehler}</p>}
      <div className="flex gap-2 pt-1">
        <Button type="button" size="sm" disabled={speichernd || !code.trim() || !name.trim()} onClick={anlegen}>
          Anlegen
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
      </div>
    </div>
  );
}

function BestandTab({ artikelId }: { artikelId: string }) {
  const [bestand, setBestand] = useState<Lagerbestand[]>([]);
  const [lagerListe, setLagerListe] = useState<Lager[]>([]);
  const [lagerId, setLagerId] = useState('');
  const [menge, setMenge] = useState('');
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState<string | null>(null);
  const [speichernd, setSpeichernd] = useState(false);

  async function laden() {
    const [b, l] = await Promise.all([
      api.get<Lagerbestand[]>(`/lager/artikel/${artikelId}/bestand`),
      api.get<Lager[]>('/lager'),
    ]);
    setBestand(b);
    setLagerListe(l);
    setLagerId((aktuell) => aktuell || l[0]?.id || '');
  }

  useEffect(() => {
    laden();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artikelId]);

  async function buchen(typ: 'wareneingang' | 'warenausgang') {
    setFehler(null);
    setErfolg(null);
    if (!lagerId || !menge) {
      setFehler('Bitte Lager und Menge angeben.');
      return;
    }
    setSpeichernd(true);
    try {
      await api.post(`/lagerbewegung/${typ}`, { artikelId, lagerId, menge });
      setErfolg(typ === 'wareneingang' ? 'Wareneingang gebucht.' : 'Warenausgang gebucht.');
      setMenge('');
      await laden();
    } catch (err) {
      setFehler(err instanceof ApiError ? err.message : 'Buchung fehlgeschlagen.');
    } finally {
      setSpeichernd(false);
    }
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lager</TableHead>
            <TableHead>Menge</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bestand.length === 0 && (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-muted-foreground">
                Kein Bestand vorhanden.
              </TableCell>
            </TableRow>
          )}
          {bestand.map((b) => (
            <TableRow key={b.id}>
              <TableCell>{b.lager?.bezeichnung ?? b.lagerId}</TableCell>
              <TableCell>{b.menge}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {lagerListe.length > 0 && (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Bewegung buchen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Lager</Label>
                <Select value={lagerId} onValueChange={setLagerId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {lagerListe.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.bezeichnung}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Menge</Label>
                <Input value={menge} onChange={(e) => setMenge(e.target.value)} placeholder="z. B. 10" />
              </div>
            </div>
            {fehler && <p className="text-sm text-destructive">{fehler}</p>}
            {erfolg && <p className="text-sm text-primary">{erfolg}</p>}
            <div className="flex gap-2">
              <Button type="button" disabled={speichernd} onClick={() => buchen('wareneingang')}>
                Wareneingang
              </Button>
              <Button type="button" variant="outline" disabled={speichernd} onClick={() => buchen('warenausgang')}>
                Warenausgang
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PreiseTab({ artikelId }: { artikelId: string }) {
  const [preise, setPreise] = useState<Artikelpreis[]>([]);
  const [kunden, setKunden] = useState<Kunde[]>([]);
  const [kundeId, setKundeId] = useState('alle');
  const [staffelAbMenge, setStaffelAbMenge] = useState('0');
  const [preisNetto, setPreisNetto] = useState('');
  const [fehler, setFehler] = useState<string | null>(null);
  const [speichernd, setSpeichernd] = useState(false);

  async function laden() {
    const [p, k] = await Promise.all([
      api.get<Artikelpreis[]>(`/preise/artikel/${artikelId}`),
      api.get<Kunde[]>('/kunden'),
    ]);
    setPreise(p);
    setKunden(k);
  }

  useEffect(() => {
    laden();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artikelId]);

  async function anlegen(e: FormEvent) {
    e.preventDefault();
    setFehler(null);
    setSpeichernd(true);
    try {
      await api.post('/preise', {
        artikelId,
        kundeId: kundeId === 'alle' ? undefined : kundeId,
        staffelAbMenge,
        preisNetto,
      });
      setPreisNetto('');
      await laden();
    } catch (err) {
      setFehler(err instanceof ApiError ? err.message : 'Preis konnte nicht angelegt werden.');
    } finally {
      setSpeichernd(false);
    }
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kunde</TableHead>
            <TableHead>Ab Menge</TableHead>
            <TableHead>Preis netto</TableHead>
            <TableHead>Priorität</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {preise.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                Noch keine Preise hinterlegt.
              </TableCell>
            </TableRow>
          )}
          {preise.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{kunden.find((k) => k.id === p.kundeId)?.firmenname ?? 'Alle Kunden'}</TableCell>
              <TableCell>{p.staffelAbMenge}</TableCell>
              <TableCell>{p.preisNetto} €</TableCell>
              <TableCell>{p.prioritaet}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Preis anlegen</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={anlegen} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Kunde</Label>
              <Select value={kundeId} onValueChange={setKundeId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle Kunden (allgemeiner Preis)</SelectItem>
                  {kunden.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.firmenname ?? `${k.vorname} ${k.nachname}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Ab Menge</Label>
                <Input value={staffelAbMenge} onChange={(e) => setStaffelAbMenge(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Preis netto (€)</Label>
                <Input value={preisNetto} onChange={(e) => setPreisNetto(e.target.value)} required />
              </div>
            </div>
            {fehler && <p className="text-sm text-destructive">{fehler}</p>}
            <Button type="submit" disabled={speichernd}>
              {speichernd ? 'Speichert…' : 'Anlegen'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function LieferantenTab({ artikelId }: { artikelId: string }) {
  const [zuordnungen, setZuordnungen] = useState<ArtikelLieferant[]>([]);
  const [lieferantenListe, setLieferantenListe] = useState<Lieferant[]>([]);
  const [lieferantId, setLieferantId] = useState('');
  const [fehler, setFehler] = useState<string | null>(null);
  const [speichernd, setSpeichernd] = useState(false);

  async function laden() {
    const [z, l] = await Promise.all([
      api.get<ArtikelLieferant[]>(`/artikel/${artikelId}/lieferant`),
      api.get<Lieferant[]>('/lieferanten'),
    ]);
    setZuordnungen(z);
    setLieferantenListe(l);
    setLieferantId((aktuell) => aktuell || l[0]?.id || '');
  }

  useEffect(() => {
    laden();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artikelId]);

  async function zuordnen(e: FormEvent) {
    e.preventDefault();
    setFehler(null);
    if (!lieferantId) return;
    setSpeichernd(true);
    try {
      await api.post(`/artikel/${artikelId}/lieferant`, { lieferantId });
      await laden();
    } catch (err) {
      setFehler(err instanceof ApiError ? err.message : 'Zuordnung fehlgeschlagen.');
    } finally {
      setSpeichernd(false);
    }
  }

  async function favoritSetzen(zuordnungId: string) {
    setFehler(null);
    try {
      await api.post(`/artikel/${artikelId}/lieferant/${zuordnungId}/favorit`);
      await laden();
    } catch (err) {
      setFehler(err instanceof ApiError ? err.message : 'Favorit konnte nicht gesetzt werden.');
    }
  }

  const nichtZugeordnet = lieferantenListe.filter((l) => !zuordnungen.some((z) => z.lieferantId === l.id));

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lieferant</TableHead>
            <TableHead>Lieferanten-Art.-Nr.</TableHead>
            <TableHead>Einkaufspreis</TableHead>
            <TableHead>Lieferzeit</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {zuordnungen.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Noch kein Lieferant zugeordnet.
              </TableCell>
            </TableRow>
          )}
          {zuordnungen.map((z) => (
            <TableRow key={z.id}>
              <TableCell>{z.lieferant?.firmenname ?? z.lieferantId}</TableCell>
              <TableCell>{z.lieferantenArtikelnummer ?? '–'}</TableCell>
              <TableCell>{z.einkaufspreis ? `${z.einkaufspreis} €` : '–'}</TableCell>
              <TableCell>{z.lieferzeitTage ? `${z.lieferzeitTage} Tage` : '–'}</TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" title="Als Favorit setzen" onClick={() => favoritSetzen(z.id)}>
                  <Star className={z.istBevorzugt ? 'h-4 w-4 fill-primary text-primary' : 'h-4 w-4 text-muted-foreground'} />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {nichtZugeordnet.length > 0 && (
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Lieferant zuordnen</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={zuordnen} className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label>Lieferant</Label>
                <Select value={lieferantId} onValueChange={setLieferantId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {nichtZugeordnet.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.firmenname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={speichernd}>
                Zuordnen
              </Button>
            </form>
            {fehler && <p className="mt-2 text-sm text-destructive">{fehler}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Sprachen-Tab: Kurztext/Langtext je Zusatzsprache, Muster aus ERP v1
// (waelderbytes-suite, ArtikelWizard.tsx UebersetzungenBlock). "de" wird hier
// bewusst NICHT angeboten - das sind die Felder im Tab "Stammdaten"
// (bezeichnung/beschreibung), siehe Backend-Kommentar in artikel.service.ts.
function SprachenTab({ artikelId }: { artikelId: string }) {
  const [uebersetzungen, setUebersetzungen] = useState<ArtikelUebersetzung[]>([]);
  const [aktiveSprache, setAktiveSprache] = useState<string | null>(null);
  const [neueSprache, setNeueSprache] = useState('');
  const [kurztext, setKurztext] = useState('');
  const [langtext, setLangtext] = useState('');
  const [fehler, setFehler] = useState<string | null>(null);
  const [speichernd, setSpeichernd] = useState(false);

  async function laden() {
    const liste = await api.get<ArtikelUebersetzung[]>(`/artikel/${artikelId}/uebersetzungen`);
    setUebersetzungen(liste);
    if (!aktiveSprache && liste[0]) setAktiveSprache(liste[0].sprache);
  }

  useEffect(() => {
    laden();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artikelId]);

  useEffect(() => {
    const treffer = uebersetzungen.find((u) => u.sprache === aktiveSprache);
    setKurztext(treffer?.kurztext ?? '');
    setLangtext(treffer?.langtext ?? '');
  }, [aktiveSprache, uebersetzungen]);

  function hinzufuegen() {
    const code = neueSprache.trim().toLowerCase();
    if (!code || code === 'de' || uebersetzungen.some((u) => u.sprache === code)) return;
    setAktiveSprache(code);
    setNeueSprache('');
  }

  async function speichern() {
    if (!aktiveSprache) return;
    setFehler(null);
    setSpeichernd(true);
    try {
      const saved = await api.put<ArtikelUebersetzung>(`/artikel/${artikelId}/uebersetzungen/${aktiveSprache}`, {
        kurztext: kurztext || undefined,
        langtext: langtext || undefined,
      });
      setUebersetzungen((liste) => [...liste.filter((u) => u.sprache !== aktiveSprache), saved]);
    } catch (err) {
      setFehler(err instanceof ApiError ? err.message : 'Speichern fehlgeschlagen.');
    } finally {
      setSpeichernd(false);
    }
  }

  async function loeschen(sprache: string) {
    setFehler(null);
    try {
      await api.delete(`/artikel/${artikelId}/uebersetzungen/${sprache}`);
      setUebersetzungen((liste) => liste.filter((u) => u.sprache !== sprache));
      if (aktiveSprache === sprache) setAktiveSprache(null);
    } catch (err) {
      setFehler(err instanceof ApiError ? err.message : 'Löschen fehlgeschlagen.');
    }
  }

  const istNeueSprache = aktiveSprache !== null && !uebersetzungen.some((u) => u.sprache === aktiveSprache);

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Weitere Sprachen für Kurztext/Langtext</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Für Belege an fremdsprachige Kunden (siehe Kunde → Sprache). „de“ wird hier nicht geführt – dafür Kurztext/
          Langtext im Tab „Stammdaten“ verwenden.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {uebersetzungen.map((u) => (
            <button
              key={u.sprache}
              type="button"
              onClick={() => setAktiveSprache(u.sprache)}
              className={cn(
                'rounded-md border px-2.5 py-1 text-xs font-medium',
                aktiveSprache === u.sprache ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
              )}
            >
              {u.sprache.toUpperCase()}
            </button>
          ))}
          {istNeueSprache && (
            <span className="rounded-md border border-primary bg-primary/10 px-2.5 py-1 text-xs font-medium">
              {aktiveSprache!.toUpperCase()} (neu)
            </span>
          )}
          <Input
            className="h-7 w-16 text-xs"
            placeholder="z. B. en"
            maxLength={5}
            value={neueSprache}
            onChange={(e) => setNeueSprache(e.target.value)}
          />
          <Button type="button" size="sm" variant="outline" onClick={hinzufuegen}>
            + Sprache
          </Button>
        </div>

        {aktiveSprache && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Kurztext ({aktiveSprache.toUpperCase()})</Label>
              <Input value={kurztext} onChange={(e) => setKurztext(e.target.value)} maxLength={100} />
            </div>
            <div className="space-y-1.5">
              <Label>Langtext ({aktiveSprache.toUpperCase()})</Label>
              <textarea
                value={langtext}
                onChange={(e) => setLangtext(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            {fehler && <p className="text-sm text-destructive">{fehler}</p>}
            <div className="flex gap-2">
              <Button type="button" size="sm" disabled={speichernd} onClick={speichern}>
                {speichernd ? 'Speichert…' : 'Speichern'}
              </Button>
              {!istNeueSprache && (
                <Button type="button" size="sm" variant="ghost" onClick={() => loeschen(aktiveSprache)}>
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Sprache entfernen
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Roadmap-Punkt "Log-Tab": kombinierte, chronologische Ansicht aus Audit-Trail
// (jede Aenderung an artikel, DB-Trigger-basiert, siehe architecture.md
// Abschnitt 5) und Lagerbuchungen. Filter "Nur Buchungen" blendet die
// generischen Audit-Eintraege aus, zeigt nur die tatsaechlichen
// Lagerbewegungen - beides kommt vom selben Backend-Endpoint, das Filtern
// passiert rein im Frontend (kein zweiter Request noetig).
const LAGERBEWEGUNG_TYP_LABEL: Record<string, string> = {
  wareneingang: 'Wareneingang',
  warenausgang: 'Warenausgang',
  umbuchung: 'Umbuchung',
  inventur_korrektur: 'Inventurkorrektur',
};

const ARTIKEL_FELD_LABEL: Record<string, string> = {
  bezeichnung: 'Kurztext',
  beschreibung: 'Langtext',
  einheit_id: 'Einheit',
  ean_gtin: 'EAN/GTIN',
  hersteller: 'Hersteller',
  hersteller_artikelnummer: 'Hersteller-Art.-Nr.',
  interne_notiz: 'Interne Notiz',
  bestandsgefuehrt: 'Bestandsgeführt',
  bomfaehig: 'Stücklistenfähig',
  gewicht_kg: 'Gewicht',
  laenge_mm: 'Länge',
  breite_mm: 'Breite',
  hoehe_mm: 'Höhe',
  mindestbestand: 'Mindestbestand',
  aktiv: 'Aktiv',
};

interface LogZeile {
  id: string;
  zeitpunkt: string;
  istBuchung: boolean;
  text: string;
  benutzer: string | null;
}

function LogTab({ artikelId }: { artikelId: string }) {
  const [log, setLog] = useState<ArtikelLog | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [nurBuchungen, setNurBuchungen] = useState(false);
  // Benutzer-ID -> Anzeigename. GET /benutzer ist exklusiv Owner/Administrator
  // vorbehalten (siehe auth-service benutzer.controller.ts) - bei anderen
  // Rollen schlaegt das mit 403 fehl, dann bleibt es einfach bei der rohen
  // UUID (kein Absturz, siehe Catch unten).
  const [benutzerKarte, setBenutzerKarte] = useState<Record<string, string>>({});

  useEffect(() => {
    api
      .get<ArtikelLog>(`/artikel/${artikelId}/log`)
      .then(setLog)
      .catch((err) => setFehler(err instanceof ApiError ? err.message : 'Log konnte nicht geladen werden.'));
    api
      .get<Benutzer[]>('/benutzer')
      .then((liste) => {
        const karte: Record<string, string> = {};
        liste.forEach((b) => {
          karte[b.id] = b.vorname || b.nachname ? `${b.vorname ?? ''} ${b.nachname ?? ''}`.trim() : b.email;
        });
        setBenutzerKarte(karte);
      })
      .catch(() => undefined);
  }, [artikelId]);

  function benutzerAnzeige(id: string | null): string {
    if (!id) return '–';
    return benutzerKarte[id] ?? id;
  }

  if (fehler) return <p className="text-sm text-destructive">{fehler}</p>;
  if (!log) return <p className="text-sm text-muted-foreground">Lädt…</p>;

  const buchungsZeilen: LogZeile[] = log.lagerbewegungen.map((b) => {
    const vorzeichen = Number(b.menge) >= 0 ? '+' : '';
    const teile = [
      `${LAGERBEWEGUNG_TYP_LABEL[b.typ] ?? b.typ}: ${vorzeichen}${b.menge} (${b.lager?.bezeichnung ?? b.lagerId})`,
    ];
    if (b.kommentar) teile.push(b.kommentar);
    return {
      id: `bewegung-${b.id}`,
      zeitpunkt: b.gebuchtAm,
      istBuchung: true,
      text: teile.join(' – '),
      benutzer: b.gebuchtVon,
    };
  });

  const auditZeilen: LogZeile[] = log.auditLog.map((e) => {
    let text: string;
    if (e.operation === 'INSERT') {
      text = 'Artikel angelegt';
    } else if (e.operation === 'DELETE') {
      text = 'Artikel gelöscht';
    } else {
      const geaendert = Object.keys(e.newData ?? {}).filter((feld) => {
        const alt = e.oldData?.[feld];
        const neu = e.newData?.[feld];
        return JSON.stringify(alt) !== JSON.stringify(neu);
      });
      text =
        geaendert.length > 0
          ? `Geändert: ${geaendert.map((f) => ARTIKEL_FELD_LABEL[f] ?? f).join(', ')}`
          : 'Geändert';
    }
    return {
      id: `audit-${e.id}`,
      zeitpunkt: e.changedAt,
      istBuchung: false,
      text,
      benutzer: e.changedBy,
    };
  });

  const zeilen = [...buchungsZeilen, ...auditZeilen]
    .filter((z) => !nurBuchungen || z.istBuchung)
    .sort((a, b) => new Date(b.zeitpunkt).getTime() - new Date(a.zeitpunkt).getTime());

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={nurBuchungen} onChange={(e) => setNurBuchungen(e.target.checked)} />
        Nur Buchungen anzeigen
      </label>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-40">Zeitpunkt</TableHead>
            <TableHead className="w-24">Art</TableHead>
            <TableHead>Ereignis</TableHead>
            <TableHead className="w-48">Benutzer</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {zeilen.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                Keine Einträge vorhanden.
              </TableCell>
            </TableRow>
          )}
          {zeilen.map((z) => (
            <TableRow key={z.id}>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {new Date(z.zeitpunkt).toLocaleString('de-DE')}
              </TableCell>
              <TableCell className="text-xs">{z.istBuchung ? 'Buchung' : 'Änderung'}</TableCell>
              <TableCell className="text-sm">{z.text}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{benutzerAnzeige(z.benutzer)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Roadmap-Punkt "Stückliste (BOM)", mehrstufig (Nutzerentscheidung
// 08.08.2026): direkte Positionen dieses Artikels sind hier editierbar
// (hinzufügen/Menge ändern/entfernen). Ist eine Position selbst
// stücklistenfähig, kann sie nur zur ANSICHT aufgeklappt werden (lazy
// geladen, rekursiv) - editiert wird eine Unter-Stückliste bewusst auf der
// eigenen Artikelseite dieser Position, nicht verschachtelt hier, um die
// Oberfläche nicht zu überladen. Zirkelbezug-Schutz passiert serverseitig
// (siehe stueckliste.service.ts), das Frontend verlässt sich darauf.
function StuecklisteTab({ artikel }: { artikel: Artikel }) {
  const [positionen, setPositionen] = useState<StuecklistePosition[]>([]);
  const [artikelListe, setArtikelListe] = useState<Artikel[]>([]);
  const [neuPositionArtikelId, setNeuPositionArtikelId] = useState<string | null>(null);
  const [neuMenge, setNeuMenge] = useState('1');
  const [fehler, setFehler] = useState<string | null>(null);
  const [speichernd, setSpeichernd] = useState(false);
  const [druckLaedt, setDruckLaedt] = useState(false);

  async function laden() {
    const [p, liste] = await Promise.all([
      api.get<StuecklistePosition[]>(`/artikel/${artikel.id}/stueckliste`),
      api.get<Artikel[]>('/artikel'),
    ]);
    setPositionen(p);
    setArtikelListe(liste.filter((a) => a.id !== artikel.id));
  }

  useEffect(() => {
    laden();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artikel.id]);

  const artikelOptionen = artikelListe.map((a) => ({ id: a.id, label: `${a.artikelnummer} – ${a.bezeichnung}` }));

  async function hinzufuegen() {
    if (!neuPositionArtikelId || !neuMenge) return;
    setFehler(null);
    setSpeichernd(true);
    try {
      await api.post(`/artikel/${artikel.id}/stueckliste`, {
        positionArtikelId: neuPositionArtikelId,
        menge: neuMenge,
      });
      setNeuPositionArtikelId(null);
      setNeuMenge('1');
      await laden();
    } catch (err) {
      setFehler(err instanceof ApiError ? err.message : 'Position konnte nicht hinzugefügt werden.');
    } finally {
      setSpeichernd(false);
    }
  }

  async function mengeAendern(positionId: string, menge: string) {
    setFehler(null);
    try {
      await api.patch(`/artikel/${artikel.id}/stueckliste/${positionId}`, { menge });
      await laden();
    } catch (err) {
      setFehler(err instanceof ApiError ? err.message : 'Menge konnte nicht geändert werden.');
    }
  }

  async function entfernen(positionId: string) {
    setFehler(null);
    try {
      await api.delete(`/artikel/${artikel.id}/stueckliste/${positionId}`);
      await laden();
    } catch (err) {
      setFehler(err instanceof ApiError ? err.message : 'Position konnte nicht entfernt werden.');
    }
  }

  // Druckbare, komplett aufgelöste Strukturstückliste (alle Ebenen auf
  // einmal) - oeffnet bewusst ein eigenes Fenster mit minimalem HTML statt
  // die App-Navigation/Buttons mitzudrucken.
  async function drucken() {
    setDruckLaedt(true);
    setFehler(null);
    try {
      const baum = await api.get<StuecklisteKnoten>(`/artikel/${artikel.id}/stueckliste/aufgeloest`);
      const zeilen: { ebene: number; artikelnummer: string; bezeichnung: string; menge: string; effektiveMenge: string; einheit: string }[] = [];
      function einsammeln(knoten: StuecklisteKnoten, ebene: number) {
        if (ebene > 0) {
          zeilen.push({
            ebene,
            artikelnummer: knoten.artikel.artikelnummer,
            bezeichnung: knoten.artikel.bezeichnung,
            menge: knoten.menge,
            effektiveMenge: knoten.effektiveMenge,
            einheit: knoten.artikel.einheit?.code ?? '',
          });
        }
        knoten.kinder.forEach((k) => einsammeln(k, ebene + 1));
      }
      einsammeln(baum, 0);

      const fenster = window.open('', '_blank');
      if (!fenster) {
        setFehler('Popup wurde vom Browser blockiert - bitte Popups für diese Seite erlauben.');
        return;
      }
      const zeilenHtml = zeilen
        .map(
          (z) => `<tr>
            <td style="padding-left:${(z.ebene - 1) * 20}px">${z.artikelnummer}</td>
            <td>${z.bezeichnung}</td>
            <td style="text-align:right">${z.menge} ${z.einheit}</td>
            <td style="text-align:right">${z.effektiveMenge} ${z.einheit}</td>
          </tr>`,
        )
        .join('');
      fenster.document.write(`<!doctype html>
        <html lang="de">
        <head>
          <meta charset="utf-8" />
          <title>Strukturstückliste ${artikel.artikelnummer} – ${artikel.bezeichnung}</title>
          <style>
            body { font-family: sans-serif; font-size: 12px; padding: 24px; color: #111; }
            h1 { font-size: 16px; margin-bottom: 2px; }
            p { color: #555; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border-bottom: 1px solid #ddd; padding: 4px 8px; font-size: 12px; text-align: left; }
            th { background: #f0f0f0; }
          </style>
        </head>
        <body>
          <h1>Strukturstückliste: ${artikel.artikelnummer} – ${artikel.bezeichnung}</h1>
          <p>Erstellt am ${new Date().toLocaleString('de-DE')}</p>
          <table>
            <thead>
              <tr><th>Artikelnummer</th><th>Bezeichnung</th><th>Menge (je Elternteil)</th><th>Menge gesamt</th></tr>
            </thead>
            <tbody>${zeilenHtml || '<tr><td colspan="4">Keine Positionen vorhanden.</td></tr>'}</tbody>
          </table>
        </body>
        </html>`);
      fenster.document.close();
      fenster.focus();
      fenster.print();
    } catch (err) {
      setFehler(err instanceof ApiError ? err.message : 'Strukturstückliste konnte nicht geladen werden.');
    } finally {
      setDruckLaedt(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="max-w-md text-xs text-muted-foreground">
          Direkte Positionen dieses Artikels. Ist eine Position selbst stücklistenfähig, lässt sie sich aufklappen
          (nur zur Ansicht - bearbeitet wird sie auf ihrer eigenen Artikelseite).
        </p>
        <Button type="button" variant="outline" size="sm" disabled={druckLaedt} onClick={drucken}>
          {druckLaedt ? 'Lädt…' : 'Strukturstückliste drucken'}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Artikel</TableHead>
            <TableHead className="w-32">Menge</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {positionen.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                Noch keine Positionen vorhanden.
              </TableCell>
            </TableRow>
          )}
          {positionen.map((p) => (
            <StuecklisteZeile key={p.id} position={p} onMengeAendern={mengeAendern} onEntfernen={entfernen} />
          ))}
        </TableBody>
      </Table>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Position hinzufügen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>Artikel</Label>
            <SearchCreateDropdown
              value={neuPositionArtikelId}
              options={artikelOptionen}
              placeholder="Artikel suchen…"
              onSelect={setNeuPositionArtikelId}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Menge</Label>
            <Input value={neuMenge} onChange={(e) => setNeuMenge(e.target.value)} placeholder="z. B. 4" />
          </div>
          {fehler && <p className="text-sm text-destructive">{fehler}</p>}
          <Button type="button" disabled={speichernd || !neuPositionArtikelId} onClick={hinzufuegen}>
            {speichernd ? 'Speichert…' : 'Hinzufügen'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function StuecklisteZeile({
  position,
  onMengeAendern,
  onEntfernen,
}: {
  position: StuecklistePosition;
  onMengeAendern: (positionId: string, menge: string) => void;
  onEntfernen: (positionId: string) => void;
}) {
  const [menge, setMenge] = useState(position.menge);
  const [aufgeklappt, setAufgeklappt] = useState(false);
  const istBomfaehig = position.positionArtikel?.bomfaehig ?? false;

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="flex items-center gap-1.5">
            {istBomfaehig ? (
              <button
                type="button"
                onClick={() => setAufgeklappt((v) => !v)}
                className="w-4 shrink-0 text-muted-foreground"
                title={aufgeklappt ? 'Zuklappen' : 'Aufklappen'}
              >
                {aufgeklappt ? '▾' : '▸'}
              </button>
            ) : (
              <span className="w-4 shrink-0" />
            )}
            <span className="font-mono text-xs text-muted-foreground">{position.positionArtikel?.artikelnummer}</span>
            <span className="truncate">{position.positionArtikel?.bezeichnung ?? position.positionArtikelId}</span>
          </div>
        </TableCell>
        <TableCell>
          <Input
            className="h-7"
            value={menge}
            onChange={(e) => setMenge(e.target.value)}
            onBlur={() => menge !== position.menge && onMengeAendern(position.id, menge)}
          />
        </TableCell>
        <TableCell>
          <Button variant="ghost" size="icon" title="Entfernen" onClick={() => onEntfernen(position.id)}>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </TableCell>
      </TableRow>
      {aufgeklappt && istBomfaehig && (
        <TableRow>
          <TableCell colSpan={3} className="bg-muted/30 p-0">
            <StuecklisteUnterbaum artikelId={position.positionArtikelId} ebene={1} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// Nur-Ansicht, rekursiv, lazy-geladen je Ebene - siehe Kommentar bei
// StuecklisteTab, warum hier nicht editiert wird.
function StuecklisteUnterbaum({ artikelId, ebene }: { artikelId: string; ebene: number }) {
  const [positionen, setPositionen] = useState<StuecklistePosition[] | null>(null);

  useEffect(() => {
    api
      .get<StuecklistePosition[]>(`/artikel/${artikelId}/stueckliste`)
      .then(setPositionen)
      .catch(() => setPositionen([]));
  }, [artikelId]);

  if (positionen === null) return <p className="px-3 py-1.5 text-xs text-muted-foreground">Lädt…</p>;
  if (positionen.length === 0) return <p className="px-3 py-1.5 text-xs text-muted-foreground">Keine Positionen.</p>;

  return (
    <div className="divide-y divide-border">
      {positionen.map((p) => (
        <StuecklisteUnterzeile key={p.id} position={p} ebene={ebene} />
      ))}
    </div>
  );
}

function StuecklisteUnterzeile({ position, ebene }: { position: StuecklistePosition; ebene: number }) {
  const [aufgeklappt, setAufgeklappt] = useState(false);
  const istBomfaehig = position.positionArtikel?.bomfaehig ?? false;

  return (
    <div>
      <div
        className="flex items-center justify-between px-3 py-1.5 text-sm"
        style={{ paddingLeft: `${12 + ebene * 16}px` }}
      >
        <div className="flex items-center gap-1.5">
          {istBomfaehig ? (
            <button
              type="button"
              onClick={() => setAufgeklappt((v) => !v)}
              className="w-4 shrink-0 text-muted-foreground"
              title={aufgeklappt ? 'Zuklappen' : 'Aufklappen'}
            >
              {aufgeklappt ? '▾' : '▸'}
            </button>
          ) : (
            <span className="w-4 shrink-0" />
          )}
          <span className="font-mono text-xs text-muted-foreground">{position.positionArtikel?.artikelnummer}</span>
          <span>{position.positionArtikel?.bezeichnung ?? position.positionArtikelId}</span>
        </div>
        <span className="text-xs text-muted-foreground">{position.menge}</span>
      </div>
      {aufgeklappt && istBomfaehig && <StuecklisteUnterbaum artikelId={position.positionArtikelId} ebene={ebene + 1} />}
    </div>
  );
}
