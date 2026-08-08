// Generische Detail-/Anlegen-Ansicht fuer die Belegkette - EIN Component-Body,
// vier duenne Wrapper-Exports (siehe App.tsx). Positionen werden wie bei
// Bestellung (siehe einkauf.service.ts) einmalig beim Anlegen als komplettes
// Array uebergeben, nicht einzeln nachtraeglich hinzugefuegt/bearbeitet -
// gleicher Zuschnitt wie das bereits bestehende Einkauf/Bestellwesen-Modul.
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { SearchCreateDropdown } from '@/components/ui/search-create-dropdown';
import { PageHeading } from '@/components/ui/page-heading';
import { api, ApiError } from '@/lib/api';
import { Artikel, Beleg, BelegPosition, BelegTyp, Firma, Kunde, Lager, Steuersatz } from '@/lib/types';
import { BELEG_NACHFOLGER, BELEG_STATUS_LABEL, BELEG_TYP_LABEL, BELEG_TYP_PFAD } from '@/lib/beleg-labels';

function kundenName(k?: Kunde): string {
  if (!k) return '–';
  return k.typ === 'firma' ? (k.firmenname ?? '–') : `${k.vorname ?? ''} ${k.nachname ?? ''}`.trim() || '–';
}

interface EntwurfPosition {
  key: string;
  artikelId: string | null;
  bezeichnungArtikel: string; // nur Anzeige, wird bei artikelId gesetzt nicht mitgeschickt
  bezeichnungFreitext: string;
  menge: string;
  einzelpreis: string; // leer = automatische Preisfindung
  steuersatzId: string | null; // leer = vom Artikel abgeleitet
}

function neueEntwurfPosition(): EntwurfPosition {
  return {
    key: Math.random().toString(36).slice(2),
    artikelId: null,
    bezeichnungArtikel: '',
    bezeichnungFreitext: '',
    menge: '1',
    einzelpreis: '',
    steuersatzId: null,
  };
}

// Summenberechnung nur fuer bereits gespeicherte Belege (echte Snapshots
// vorhanden) - fuer den Entwurf wird bewusst keine Live-Summe gezeigt, da
// Preis/Steuersatz bis zum Speichern ggf. noch automatisch ermittelt werden
// (siehe beleg.service.ts::loesePositionAuf).
function berechneSummen(positionen: BelegPosition[], kleinunternehmer: boolean) {
  let netto = 0;
  const steuerJeSatz = new Map<string, number>();
  for (const p of positionen) {
    const zeilenNetto = Number(p.menge) * Number(p.einzelpreis);
    netto += zeilenNetto;
    if (!kleinunternehmer) {
      const satz = p.steuersatzProzent;
      const steuer = (zeilenNetto * Number(satz)) / 100;
      steuerJeSatz.set(satz, (steuerJeSatz.get(satz) ?? 0) + steuer);
    }
  }
  const steuerGesamt = [...steuerJeSatz.values()].reduce((a, b) => a + b, 0);
  return { netto, steuerJeSatz, steuerGesamt, brutto: netto + steuerGesamt };
}

function BelegDetailGeneric({ belegTyp }: { belegTyp: BelegTyp }) {
  const { id } = useParams();
  const navigate = useNavigate();
  // Gleiches Muster wie ArtikelDetail.tsx: KEINE separate ":neu"-Route, ":id"
  // matcht auch "/xyz/neu" - siehe dortiger Kommentar zum urspruenglichen Bug.
  const istNeu = id === 'neu';
  const pfad = BELEG_TYP_PFAD[belegTyp];

  const [beleg, setBeleg] = useState<Beleg | null>(null);
  const [ladend, setLadend] = useState(!istNeu);
  const [ladeFehler, setLadeFehler] = useState<string | null>(null);
  const [aktionFehler, setAktionFehler] = useState<string | null>(null);

  const [kundeId, setKundeId] = useState<string | null>(null);
  const [belegdatum, setBelegdatum] = useState(() => new Date().toISOString().slice(0, 10));
  const [kommentar, setKommentar] = useState('');
  const [lagerId, setLagerId] = useState<string | null>(null);
  const [entwurfPositionen, setEntwurfPositionen] = useState<EntwurfPosition[]>([neueEntwurfPosition()]);
  const [speichernd, setSpeichernd] = useState(false);

  const [kunden, setKunden] = useState<Kunde[]>([]);
  const [artikelListe, setArtikelListe] = useState<Artikel[]>([]);
  const [steuersaetze, setSteuersaetze] = useState<Steuersatz[]>([]);
  const [lagerListe, setLagerListe] = useState<Lager[]>([]);
  const [firma, setFirma] = useState<Firma | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<Kunde[]>('/kunden'),
      api.get<Artikel[]>('/artikel'),
      api.get<Steuersatz[]>('/steuersaetze'),
      api.get<Lager[]>('/lager'),
      api.get<Firma>('/firma'),
    ])
      .then(([k, a, s, l, f]) => {
        setKunden(k);
        setArtikelListe(a);
        setSteuersaetze(s);
        setLagerListe(l);
        setFirma(f);
        const standard = l.find((x) => x.istStandard);
        if (standard) setLagerId(standard.id);
      })
      .catch(() => undefined);
  }, []);

  async function laden() {
    if (istNeu) return;
    setLadend(true);
    setLadeFehler(null);
    try {
      setBeleg(await api.get<Beleg>(`/belege/beleg/${id}`));
    } catch (err) {
      setLadeFehler(err instanceof ApiError ? err.message : 'Beleg konnte nicht geladen werden.');
    } finally {
      setLadend(false);
    }
  }

  useEffect(() => {
    laden();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const artikelOptionen = artikelListe.map((a) => ({ id: a.id, label: `${a.artikelnummer} – ${a.bezeichnung}` }));
  const steuersatzOptionen = steuersaetze.filter((s) => s.aktiv);
  const lagerOptionen = lagerListe.filter((l) => l.aktiv);

  function positionAendern(key: string, patch: Partial<EntwurfPosition>) {
    setEntwurfPositionen((liste) => liste.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  }

  function artikelWaehlen(key: string, artikelId: string | null) {
    const artikel = artikelListe.find((a) => a.id === artikelId);
    positionAendern(key, {
      artikelId,
      bezeichnungArtikel: artikel?.bezeichnung ?? '',
    });
  }

  async function speichern(e: FormEvent) {
    e.preventDefault();
    setAktionFehler(null);
    if (!kundeId) {
      setAktionFehler('Bitte einen Kunden auswählen.');
      return;
    }
    if (entwurfPositionen.length === 0) {
      setAktionFehler('Mindestens eine Position ist erforderlich.');
      return;
    }
    setSpeichernd(true);
    try {
      const positionen = entwurfPositionen.map((p) => ({
        artikelId: p.artikelId ?? undefined,
        bezeichnung: p.artikelId ? undefined : p.bezeichnungFreitext || undefined,
        menge: p.menge,
        einzelpreis: p.einzelpreis || undefined,
        steuersatzId: p.steuersatzId ?? undefined,
      }));
      const neu = await api.post<Beleg>(`/belege/${belegTyp}`, {
        kundeId,
        belegdatum,
        kommentar: kommentar || undefined,
        lagerId: belegTyp === 'lieferschein' ? lagerId ?? undefined : undefined,
        positionen,
      });
      navigate(`/${pfad}/${neu.id}`, { replace: true });
    } catch (err) {
      setAktionFehler(err instanceof ApiError ? err.message : 'Speichern fehlgeschlagen.');
    } finally {
      setSpeichernd(false);
    }
  }

  // --- Uebernehmen in den Nachfolgetyp ---------------------------------
  const nachfolgerTyp = BELEG_NACHFOLGER[belegTyp];
  const [uebernehmenOffen, setUebernehmenOffen] = useState(false);
  const [uebernehmenMengen, setUebernehmenMengen] = useState<Record<string, string>>({});
  const [uebernehmenLagerId, setUebernehmenLagerId] = useState<string | null>(null);
  const [uebernehmenLaeuft, setUebernehmenLaeuft] = useState(false);

  function uebernehmenOeffnen() {
    const init: Record<string, string> = {};
    (beleg?.positionen ?? []).forEach((p) => {
      const rest = (Number(p.menge) - Number(p.weitergefuehrteMenge)).toFixed(3);
      if (Number(rest) > 0) init[p.id] = rest;
    });
    setUebernehmenMengen(init);
    setUebernehmenLagerId(lagerListe.find((l) => l.istStandard)?.id ?? null);
    setAktionFehler(null);
    setUebernehmenOffen(true);
  }

  async function uebernehmenBestaetigen() {
    if (!beleg || !nachfolgerTyp) return;
    setUebernehmenLaeuft(true);
    setAktionFehler(null);
    try {
      const positionen = Object.entries(uebernehmenMengen)
        .filter(([, menge]) => Number(menge) > 0)
        .map(([positionId, menge]) => ({ positionId, menge }));
      if (positionen.length === 0) {
        throw new Error('Mindestens eine Position mit Menge > 0 auswählen.');
      }
      const body: Record<string, unknown> = { positionen };
      if (nachfolgerTyp === 'lieferschein') body.lagerId = uebernehmenLagerId ?? undefined;
      const neuerBeleg = await api.post<Beleg>(`/belege/beleg/${beleg.id}/uebernehmen`, body);
      navigate(`/${BELEG_TYP_PFAD[nachfolgerTyp]}/${neuerBeleg.id}`);
    } catch (err) {
      setAktionFehler(err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Übernehmen fehlgeschlagen.');
    } finally {
      setUebernehmenLaeuft(false);
    }
  }

  async function stornieren() {
    if (!beleg) return;
    setAktionFehler(null);
    try {
      await api.post(`/belege/beleg/${beleg.id}/stornieren`);
      await laden();
    } catch (err) {
      setAktionFehler(err instanceof ApiError ? err.message : 'Stornieren fehlgeschlagen.');
    }
  }

  async function festschreiben() {
    if (!beleg) return;
    setAktionFehler(null);
    try {
      await api.post(`/belege/beleg/${beleg.id}/festschreiben`);
      await laden();
    } catch (err) {
      setAktionFehler(err instanceof ApiError ? err.message : 'Festschreiben fehlgeschlagen.');
    }
  }

  const summen = useMemo(
    () => (beleg?.positionen ? berechneSummen(beleg.positionen, firma?.kleinunternehmer ?? false) : null),
    [beleg, firma],
  );

  if (ladend) return <p className="text-sm text-muted-foreground">Lädt…</p>;
  if (ladeFehler) return <p className="text-sm text-destructive">{ladeFehler}</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/${pfad}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          {beleg && (
            <div className="font-mono text-xs uppercase tracking-wide text-muted-foreground">{beleg.belegnummer}</div>
          )}
          <h1 className="text-2xl font-bold tracking-tight">
            {istNeu ? `Neu: ${BELEG_TYP_LABEL[belegTyp]}` : BELEG_TYP_LABEL[belegTyp]}
          </h1>
        </div>
      </div>

      {aktionFehler && <p className="text-sm text-destructive">{aktionFehler}</p>}

      {istNeu ? (
        <form onSubmit={speichern} className="space-y-4">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Kopfdaten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>Kunde</Label>
                <SearchCreateDropdown
                  value={kundeId}
                  options={kunden.map((k) => ({ id: k.id, label: `${k.kundennummer} – ${kundenName(k)}` }))}
                  placeholder="Kunde suchen…"
                  onSelect={setKundeId}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="belegdatum">Belegdatum</Label>
                  <Input id="belegdatum" type="date" value={belegdatum} onChange={(e) => setBelegdatum(e.target.value)} />
                </div>
                {belegTyp === 'lieferschein' && (
                  <div className="space-y-1.5">
                    <Label>Lager (für Warenausgang)</Label>
                    <SearchCreateDropdown
                      value={lagerId}
                      options={lagerOptionen.map((l) => ({ id: l.id, label: l.bezeichnung }))}
                      placeholder="Lager wählen…"
                      onSelect={setLagerId}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="kommentar">Kommentar</Label>
                <textarea
                  id="kommentar"
                  value={kommentar}
                  onChange={(e) => setKommentar(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Positionen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {entwurfPositionen.map((p, i) => (
                <div key={p.key} className="grid grid-cols-12 items-end gap-2 border-b border-border pb-3 last:border-0">
                  <div className="col-span-4 space-y-1.5">
                    <Label>Artikel</Label>
                    <SearchCreateDropdown
                      value={p.artikelId}
                      options={artikelOptionen}
                      placeholder="Artikel suchen (leer = Freitext)…"
                      onSelect={(v) => artikelWaehlen(p.key, v)}
                    />
                  </div>
                  {!p.artikelId && (
                    <div className="col-span-3 space-y-1.5">
                      <Label>Bezeichnung (Freitext)</Label>
                      <Input
                        value={p.bezeichnungFreitext}
                        onChange={(e) => positionAendern(p.key, { bezeichnungFreitext: e.target.value })}
                        placeholder="z. B. Beratung"
                      />
                    </div>
                  )}
                  <div className={p.artikelId ? 'col-span-2 space-y-1.5' : 'col-span-1 space-y-1.5'}>
                    <Label>Menge</Label>
                    <Input value={p.menge} onChange={(e) => positionAendern(p.key, { menge: e.target.value })} />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>Preis (netto, optional)</Label>
                    <Input
                      value={p.einzelpreis}
                      onChange={(e) => positionAendern(p.key, { einzelpreis: e.target.value })}
                      placeholder={p.artikelId ? 'automatisch' : 'Pflicht'}
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>Steuersatz (optional)</Label>
                    <SearchCreateDropdown
                      value={p.steuersatzId}
                      options={steuersatzOptionen.map((s) => ({ id: s.id, label: `${s.bezeichnung} (${s.satz}%)` }))}
                      placeholder={p.artikelId ? 'automatisch' : 'Pflicht'}
                      onSelect={(v) => positionAendern(p.key, { steuersatzId: v })}
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setEntwurfPositionen((liste) => liste.filter((x) => x.key !== p.key))}
                      disabled={entwurfPositionen.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEntwurfPositionen((liste) => [...liste, neueEntwurfPosition()])}
              >
                <Plus className="mr-2 h-4 w-4" />
                Position hinzufügen
              </Button>
            </CardContent>
          </Card>

          <Button type="submit" disabled={speichernd}>
            {speichernd ? 'Speichert…' : 'Speichern'}
          </Button>
        </form>
      ) : (
        beleg && (
          <div className="space-y-4">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Kopfdaten</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Kunde</div>
                  <div>{kundenName(beleg.kunde)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Belegdatum</div>
                  <div>{beleg.belegdatum}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div>
                    {BELEG_STATUS_LABEL[beleg.status]}
                    {beleg.festgeschrieben && ' · festgeschrieben'}
                  </div>
                </div>
                {beleg.referenzBeleg && (
                  <div>
                    <div className="text-xs text-muted-foreground">Vorgänger</div>
                    <button
                      type="button"
                      className="text-primary underline"
                      onClick={() => navigate(`/${BELEG_TYP_PFAD[beleg.referenzBeleg!.belegTyp]}/${beleg.referenzBeleg!.id}`)}
                    >
                      {beleg.referenzBeleg.belegnummer}
                    </button>
                  </div>
                )}
                {beleg.kommentar && (
                  <div className="col-span-2">
                    <div className="text-xs text-muted-foreground">Kommentar</div>
                    <div>{beleg.kommentar}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Positionen</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bezeichnung</TableHead>
                      <TableHead>Menge</TableHead>
                      <TableHead>Einheit</TableHead>
                      <TableHead>Einzelpreis</TableHead>
                      <TableHead>USt.</TableHead>
                      <TableHead>Summe</TableHead>
                      {nachfolgerTyp && <TableHead>Weitergeführt</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(beleg.positionen ?? []).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.bezeichnung}</TableCell>
                        <TableCell>{p.menge}</TableCell>
                        <TableCell>{p.einheitCode ?? '–'}</TableCell>
                        <TableCell>{Number(p.einzelpreis).toFixed(2)} €</TableCell>
                        <TableCell>{p.steuersatzProzent}%</TableCell>
                        <TableCell>{(Number(p.menge) * Number(p.einzelpreis)).toFixed(2)} €</TableCell>
                        {nachfolgerTyp && (
                          <TableCell className="text-muted-foreground">
                            {p.weitergefuehrteMenge} / {p.menge}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {summen && (
                  <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Netto</span>
                      <span>{summen.netto.toFixed(2)} €</span>
                    </div>
                    {firma?.kleinunternehmer ? (
                      <p className="text-xs text-muted-foreground">
                        Kein Ausweis von Umsatzsteuer gemäß § 19 UStG (Kleinunternehmerregelung).
                      </p>
                    ) : (
                      <>
                        {[...summen.steuerJeSatz.entries()].map(([satz, betrag]) => (
                          <div key={satz} className="flex justify-between text-muted-foreground">
                            <span>USt. {satz}%</span>
                            <span>{betrag.toFixed(2)} €</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-semibold">
                          <span>Brutto</span>
                          <span>{summen.brutto.toFixed(2)} €</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-2">
              {nachfolgerTyp && beleg.status !== 'storniert' && (
                <Button onClick={uebernehmenOeffnen}>Nach {BELEG_TYP_LABEL[nachfolgerTyp]} übernehmen</Button>
              )}
              {belegTyp === 'rechnung' && !beleg.festgeschrieben && beleg.status !== 'storniert' && (
                <Button variant="outline" onClick={festschreiben}>
                  Als endgültig festschreiben
                </Button>
              )}
              {!beleg.festgeschrieben && beleg.status !== 'storniert' && (
                <Button variant="outline" onClick={stornieren}>
                  Stornieren
                </Button>
              )}
            </div>
          </div>
        )
      )}

      <Dialog open={uebernehmenOffen} onOpenChange={setUebernehmenOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nach {nachfolgerTyp && BELEG_TYP_LABEL[nachfolgerTyp]} übernehmen</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {(beleg?.positionen ?? []).map((p) => {
              const rest = Number(p.menge) - Number(p.weitergefuehrteMenge);
              if (rest <= 0) return null;
              return (
                <div key={p.id} className="flex items-center justify-between gap-3">
                  <div className="text-sm">
                    {p.bezeichnung} <span className="text-xs text-muted-foreground">(Rest: {rest.toFixed(3)})</span>
                  </div>
                  <Input
                    className="w-28"
                    value={uebernehmenMengen[p.id] ?? '0'}
                    onChange={(e) => setUebernehmenMengen((m) => ({ ...m, [p.id]: e.target.value }))}
                  />
                </div>
              );
            })}
            {nachfolgerTyp === 'lieferschein' && (
              <div className="space-y-1.5">
                <Label>Lager (für Warenausgang)</Label>
                <SearchCreateDropdown
                  value={uebernehmenLagerId}
                  options={lagerOptionen.map((l) => ({ id: l.id, label: l.bezeichnung }))}
                  placeholder="Lager wählen…"
                  onSelect={setUebernehmenLagerId}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUebernehmenOffen(false)}>
              Abbrechen
            </Button>
            <Button onClick={uebernehmenBestaetigen} disabled={uebernehmenLaeuft}>
              {uebernehmenLaeuft ? 'Wird übernommen…' : 'Übernehmen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function AngebotDetail() {
  return <BelegDetailGeneric belegTyp="angebot" />;
}
export function AuftragDetail() {
  return <BelegDetailGeneric belegTyp="auftragsbestaetigung" />;
}
export function LieferscheinDetail() {
  return <BelegDetailGeneric belegTyp="lieferschein" />;
}
export function RechnungDetail() {
  return <BelegDetailGeneric belegTyp="rechnung" />;
}
