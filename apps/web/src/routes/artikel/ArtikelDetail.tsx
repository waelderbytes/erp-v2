import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api, ApiError } from '@/lib/api';
import { Artikel, ArtikelLieferant, Artikelpreis, Kunde, Lager, Lagerbestand, Lieferant } from '@/lib/types';

// Detailansicht statt der frueheren getrennten "Bestand"/"Preise"-Seiten:
// Buchungen/Preise/Lieferanten-Zuordnung direkt am Artikel, wie vom Nutzer nach
// der ersten UI-Runde gewuenscht (siehe docs/CHANGELOG.md). Die eigenstaendigen
// Lager-/Preise-Uebersichtsseiten bleiben zusaetzlich bestehen (dort geht es um
// die modulweite Sicht, hier um die artikelbezogene).
export function ArtikelDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [artikel, setArtikel] = useState<Artikel | null>(null);
  const [ladeFehler, setLadeFehler] = useState<string | null>(null);

  async function laden() {
    if (!id) return;
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
  if (!artikel || !id) {
    return <p className="text-sm text-muted-foreground">Lädt…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/artikel')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="font-mono text-xs text-muted-foreground">{artikel.artikelnummer}</div>
          <h1 className="text-xl font-semibold">{artikel.bezeichnung}</h1>
        </div>
      </div>

      <Tabs defaultValue="stammdaten">
        <TabsList>
          <TabsTrigger value="stammdaten">Stammdaten</TabsTrigger>
          {artikel.bestandsgefuehrt && <TabsTrigger value="bestand">Bestand</TabsTrigger>}
          <TabsTrigger value="preise">Preise</TabsTrigger>
          <TabsTrigger value="lieferanten">Lieferanten</TabsTrigger>
        </TabsList>

        <TabsContent value="stammdaten">
          <StammdatenTab artikel={artikel} onGeaendert={setArtikel} />
        </TabsContent>
        {artikel.bestandsgefuehrt && (
          <TabsContent value="bestand">
            <BestandTab artikelId={id} />
          </TabsContent>
        )}
        <TabsContent value="preise">
          <PreiseTab artikelId={id} />
        </TabsContent>
        <TabsContent value="lieferanten">
          <LieferantenTab artikelId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StammdatenTab({ artikel, onGeaendert }: { artikel: Artikel; onGeaendert: (a: Artikel) => void }) {
  const [bezeichnung, setBezeichnung] = useState(artikel.bezeichnung);
  const [beschreibung, setBeschreibung] = useState(artikel.beschreibung ?? '');
  const [einheit, setEinheit] = useState(artikel.einheit ?? '');
  const [eanGtin, setEanGtin] = useState(artikel.eanGtin ?? '');
  const [hersteller, setHersteller] = useState(artikel.hersteller ?? '');
  const [herstellerArtikelnummer, setHerstellerArtikelnummer] = useState(artikel.herstellerArtikelnummer ?? '');
  const [bestandsgefuehrt, setBestandsgefuehrt] = useState(artikel.bestandsgefuehrt);
  const [aktiv, setAktiv] = useState(artikel.aktiv);
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState(false);
  const [speichernd, setSpeichernd] = useState(false);

  async function speichern(e: FormEvent) {
    e.preventDefault();
    setFehler(null);
    setErfolg(false);
    setSpeichernd(true);
    try {
      const aktualisiert = await api.patch<Artikel>(`/artikel/${artikel.id}`, {
        bezeichnung,
        beschreibung: beschreibung || undefined,
        einheit: einheit || undefined,
        eanGtin: eanGtin || undefined,
        hersteller: hersteller || undefined,
        herstellerArtikelnummer: herstellerArtikelnummer || undefined,
        bestandsgefuehrt,
        aktiv,
      });
      onGeaendert(aktualisiert);
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
          <div className="space-y-1.5">
            <Label htmlFor="bezeichnung">Bezeichnung</Label>
            <Input id="bezeichnung" value={bezeichnung} onChange={(e) => setBezeichnung(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="beschreibung">Beschreibung</Label>
            <textarea
              id="beschreibung"
              value={beschreibung}
              onChange={(e) => setBeschreibung(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="einheit">Einheit</Label>
              <Input id="einheit" value={einheit} onChange={(e) => setEinheit(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eanGtin">EAN/GTIN</Label>
              <Input id="eanGtin" value={eanGtin} onChange={(e) => setEanGtin(e.target.value)} />
            </div>
          </div>
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
          {artikel.artikelart !== 'dienstleistung' && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={bestandsgefuehrt} onChange={(e) => setBestandsgefuehrt(e.target.checked)} />
              Bestandsgeführt
            </label>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={aktiv} onChange={(e) => setAktiv(e.target.checked)} />
            Aktiv
          </label>
          {fehler && <p className="text-sm text-destructive">{fehler}</p>}
          {erfolg && <p className="text-sm text-primary">Gespeichert.</p>}
          <Button type="submit" disabled={speichernd}>
            {speichernd ? 'Speichert…' : 'Speichern'}
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
