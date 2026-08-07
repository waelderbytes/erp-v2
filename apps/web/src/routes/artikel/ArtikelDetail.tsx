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
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Artikel,
  ArtikelLieferant,
  ArtikelUebersetzung,
  Artikelart,
  Artikelpreis,
  Kunde,
  Lager,
  Lagerbestand,
  Lieferant,
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
  erfordertArtikel: boolean;
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

  // "Bestand" bleibt vorerst nur sichtbar, wenn bereits bekannt ist, dass der
  // Artikel bestandsgefuehrt ist (separater, noch offener Roadmap-Punkt: "Bestand-Tab
  // immer sichtbar, nur ausgegraut wenn nicht bestandsgefuehrt"). Alle anderen Tabs
  // sind immer in der Liste, aber ggf. disabled.
  const tabs: ArtikelTabDef[] = [
    { value: 'stammdaten', label: 'Stammdaten', erfordertArtikel: false },
    ...(artikel?.bestandsgefuehrt ? [{ value: 'bestand', label: 'Bestand', erfordertArtikel: true }] : []),
    { value: 'preise', label: 'Preise', erfordertArtikel: true },
    { value: 'lieferanten', label: 'Lieferanten', erfordertArtikel: true },
    { value: 'sprachen', label: 'Sprachen', erfordertArtikel: true },
  ];

  const aktuellerIndex = tabs.findIndex((t) => t.value === activeTab);
  const vorherigerTab = tabs[aktuellerIndex - 1];
  const naechsterTab = tabs[aktuellerIndex + 1];
  const weiterGesperrt = !naechsterTab || (naechsterTab.erfordertArtikel && !artikel);

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
            <TabsTrigger
              key={t.value}
              value={t.value}
              disabled={t.erfordertArtikel && !artikel}
              title={t.erfordertArtikel && !artikel ? 'Bitte zuerst Stammdaten speichern' : undefined}
            >
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
      </Tabs>

      <div className="flex justify-between pt-2">
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
          disabled={weiterGesperrt}
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
  const [einheit, setEinheit] = useState(artikel?.einheit ?? '');
  const [eanGtin, setEanGtin] = useState(artikel?.eanGtin ?? '');
  const [hersteller, setHersteller] = useState(artikel?.hersteller ?? '');
  const [herstellerArtikelnummer, setHerstellerArtikelnummer] = useState(artikel?.herstellerArtikelnummer ?? '');
  const [interneNotiz, setInterneNotiz] = useState(artikel?.interneNotiz ?? '');
  const [bestandsgefuehrt, setBestandsgefuehrt] = useState(artikel?.bestandsgefuehrt ?? false);
  const [aktiv, setAktiv] = useState(artikel?.aktiv ?? true);
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState(false);
  const [speichernd, setSpeichernd] = useState(false);

  async function speichern(e: FormEvent) {
    e.preventDefault();
    setFehler(null);
    setErfolg(false);
    setSpeichernd(true);
    try {
      if (!artikel) {
        const neuer = await api.post<Artikel>('/artikel', {
          artikelart,
          bezeichnung,
          beschreibung: beschreibung || undefined,
          einheit: einheit || undefined,
          eanGtin: eanGtin || undefined,
          bestandsgefuehrt: artikelart === 'dienstleistung' ? undefined : bestandsgefuehrt,
          hersteller: hersteller || undefined,
          herstellerArtikelnummer: herstellerArtikelnummer || undefined,
          interneNotiz: interneNotiz || undefined,
        });
        onGespeichert(neuer, true);
      } else {
        const aktualisiert = await api.patch<Artikel>(`/artikel/${artikel.id}`, {
          bezeichnung,
          beschreibung: beschreibung || undefined,
          einheit: einheit || undefined,
          eanGtin: eanGtin || undefined,
          hersteller: hersteller || undefined,
          herstellerArtikelnummer: herstellerArtikelnummer || undefined,
          interneNotiz: interneNotiz || undefined,
          bestandsgefuehrt,
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
          <div className="space-y-1.5">
            <Label htmlFor="bezeichnung">Kurztext (Bezeichnung, Deutsch)</Label>
            <Input id="bezeichnung" value={bezeichnung} onChange={(e) => setBezeichnung(e.target.value)} required autoFocus />
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
            <div className="space-y-1.5">
              <Label htmlFor="einheit">Einheit</Label>
              <Input id="einheit" placeholder="z. B. Stk, kg, m" value={einheit} onChange={(e) => setEinheit(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eanGtin">EAN/GTIN</Label>
              <Input id="eanGtin" value={eanGtin} onChange={(e) => setEanGtin(e.target.value)} />
            </div>
          </div>
          {artikelart !== 'dienstleistung' && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={bestandsgefuehrt} onChange={(e) => setBestandsgefuehrt(e.target.checked)} />
              Bestandsgeführt
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
            <CardTitle className="text-base">Bewegung buchen</CardTitle>
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
          <CardTitle className="text-base">Preis anlegen</CardTitle>
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
            <CardTitle className="text-base">Lieferant zuordnen</CardTitle>
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
        <CardTitle className="text-base">Weitere Sprachen für Kurztext/Langtext</CardTitle>
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
