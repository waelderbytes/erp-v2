// Modul Stammdaten/System-Einstellungen (Nutzerentscheidung: erstmal 1 Firma,
// siehe docs/session-handoff.md). Buendelt Firmenstammdaten,
// Artikelnummern-Schema, Steuersaetze und Nummernkreise - alles Endpoints,
// die vorher schon im Backend existierten (Firma-/Nummernkreis-Service) oder
// hier neu dazukommen (Steuersatz).
import { FormEvent, useEffect, useState } from 'react';
import { Plus, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api, ApiError } from '@/lib/api';
import { Firma, Nummernkreis, Steuersatz } from '@/lib/types';

export function StammdatenPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Stammdaten / System-Einstellungen</h1>
      <Tabs defaultValue="firma">
        <TabsList>
          <TabsTrigger value="firma">Firma</TabsTrigger>
          <TabsTrigger value="steuersaetze">Steuersätze</TabsTrigger>
          <TabsTrigger value="nummernkreise">Nummernkreise</TabsTrigger>
        </TabsList>
        <TabsContent value="firma">
          <FirmaTab />
        </TabsContent>
        <TabsContent value="steuersaetze">
          <SteuersaetzeTab />
        </TabsContent>
        <TabsContent value="nummernkreise">
          <NummernkreiseTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FirmaTab() {
  const [firma, setFirma] = useState<Firma | null>(null);
  const [ladend, setLadend] = useState(true);
  const [ladeFehler, setLadeFehler] = useState<string | null>(null);

  // Firmenstammdaten-Formularfelder
  const [name, setName] = useState('');
  const [strasse, setStrasse] = useState('');
  const [plz, setPlz] = useState('');
  const [ort, setOrt] = useState('');
  const [land, setLand] = useState('DE');
  const [ustIdNr, setUstIdNr] = useState('');
  const [steuernummer, setSteuernummer] = useState('');
  const [telefon, setTelefon] = useState('');
  const [email, setEmail] = useState('');
  const [kleinunternehmer, setKleinunternehmer] = useState(true);
  const [speichernd, setSpeichernd] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState(false);

  // Artikelnummern-Schema (eigener, separat gespeicherter Abschnitt - siehe
  // firma.service.ts: Schema ist gesperrt, sobald ein Artikel existiert;
  // Stellenanzahl ist immer aenderbar).
  const [schema, setSchema] = useState<'einfach' | 'kategorie'>('einfach');
  const [stellen, setStellen] = useState(5);
  const [schemaSpeichernd, setSchemaSpeichernd] = useState(false);
  const [schemaFehler, setSchemaFehler] = useState<string | null>(null);
  const [schemaErfolg, setSchemaErfolg] = useState(false);

  async function laden() {
    setLadend(true);
    setLadeFehler(null);
    try {
      const f = await api.get<Firma>('/firma');
      setFirma(f);
      setName(f.name ?? '');
      setStrasse(f.strasse ?? '');
      setPlz(f.plz ?? '');
      setOrt(f.ort ?? '');
      setLand(f.land ?? 'DE');
      setUstIdNr(f.ustIdNr ?? '');
      setSteuernummer(f.steuernummer ?? '');
      setTelefon(f.telefon ?? '');
      setEmail(f.email ?? '');
      setKleinunternehmer(f.kleinunternehmer);
      setSchema(f.artikelnummernSchema);
      setStellen(f.artikelnummernStellen);
    } catch (err) {
      setLadeFehler(err instanceof ApiError ? err.message : 'Firma konnte nicht geladen werden.');
    } finally {
      setLadend(false);
    }
  }

  useEffect(() => {
    laden();
  }, []);

  async function stammdatenSpeichern(e: FormEvent) {
    e.preventDefault();
    setFehler(null);
    setErfolg(false);
    setSpeichernd(true);
    try {
      const aktualisiert = await api.patch<Firma>('/firma', {
        name: name || undefined,
        strasse: strasse || undefined,
        plz: plz || undefined,
        ort: ort || undefined,
        land: land || undefined,
        ustIdNr: ustIdNr || undefined,
        steuernummer: steuernummer || undefined,
        telefon: telefon || undefined,
        email: email || undefined,
        kleinunternehmer,
      });
      setFirma(aktualisiert);
      setErfolg(true);
    } catch (err) {
      setFehler(err instanceof ApiError ? err.message : 'Speichern fehlgeschlagen.');
    } finally {
      setSpeichernd(false);
    }
  }

  async function schemaSpeichern() {
    setSchemaFehler(null);
    setSchemaErfolg(false);
    setSchemaSpeichernd(true);
    try {
      let aktuelle = firma;
      if (schema !== firma?.artikelnummernSchema) {
        aktuelle = await api.post<Firma>('/firma/artikelnummern-schema', { schema });
      }
      if (stellen !== aktuelle?.artikelnummernStellen) {
        aktuelle = await api.patch<Firma>('/firma/artikelnummern-stellen', { stellen });
      }
      if (aktuelle) setFirma(aktuelle);
      setSchemaErfolg(true);
    } catch (err) {
      setSchemaFehler(err instanceof ApiError ? err.message : 'Speichern fehlgeschlagen.');
    } finally {
      setSchemaSpeichernd(false);
    }
  }

  if (ladend) return <p className="text-sm text-muted-foreground">Lädt…</p>;
  if (ladeFehler) return <p className="text-sm text-destructive">{ladeFehler}</p>;

  return (
    <div className="grid max-w-3xl gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Firmenstammdaten</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={stammdatenSpeichern} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="fname">Firmenname</Label>
              <Input id="fname" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fstrasse">Straße/Hausnummer</Label>
              <Input id="fstrasse" value={strasse} onChange={(e) => setStrasse(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="fplz">PLZ</Label>
                <Input id="fplz" value={plz} onChange={(e) => setPlz(e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="fort">Ort</Label>
                <Input id="fort" value={ort} onChange={(e) => setOrt(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fland">Land (ISO-Code)</Label>
              <Input id="fland" value={land} maxLength={2} onChange={(e) => setLand(e.target.value.toUpperCase())} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fustid">USt-IdNr.</Label>
              <Input id="fustid" value={ustIdNr} onChange={(e) => setUstIdNr(e.target.value)} placeholder="z. B. DE123456789" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fsteuernr">Steuernummer</Label>
              <Input id="fsteuernr" value={steuernummer} onChange={(e) => setSteuernummer(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ftelefon">Telefon</Label>
              <Input id="ftelefon" value={telefon} onChange={(e) => setTelefon(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="femail">E-Mail</Label>
              <Input id="femail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={kleinunternehmer} onChange={(e) => setKleinunternehmer(e.target.checked)} />
              Kleinunternehmer (§19 UStG)
            </label>
            <p className="text-xs text-muted-foreground">
              Schwellenwerte: max. 25.000 € Vorjahresumsatz und max. 100.000 € laufendes Jahr (tatsächlicher Umsatz, keine
              Prognose). Neugründungen starten automatisch als Kleinunternehmer. Wird der Schwellenwert unterjährig
              überschritten, endet der Status sofort - manuell hier umschalten.
            </p>
            {fehler && <p className="text-sm text-destructive">{fehler}</p>}
            {erfolg && <p className="text-sm text-emerald-600">Gespeichert.</p>}
            <Button type="submit" disabled={speichernd}>
              {speichernd ? 'Speichert…' : 'Speichern'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Artikelnummern-Schema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="schema">Schema</Label>
            <Select value={schema} onValueChange={(v) => setSchema(v as 'einfach' | 'kategorie')}>
              <SelectTrigger id="schema">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="einfach">Einfach (fortlaufende Nummer)</SelectItem>
                <SelectItem value="kategorie">Kategoriebasiert</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Kann nicht mehr geändert werden, sobald mindestens ein Artikel existiert.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stellen">Stellenanzahl</Label>
            <Input
              id="stellen"
              type="number"
              min={1}
              max={15}
              value={stellen}
              onChange={(e) => setStellen(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Betrifft nur die Formatierung künftiger Nummern - jederzeit änderbar.
            </p>
          </div>
          {schemaFehler && <p className="text-sm text-destructive">{schemaFehler}</p>}
          {schemaErfolg && <p className="text-sm text-emerald-600">Gespeichert.</p>}
          <Button onClick={schemaSpeichern} disabled={schemaSpeichernd}>
            {schemaSpeichernd ? 'Speichert…' : 'Speichern'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function SteuersaetzeTab() {
  const [steuersaetze, setSteuersaetze] = useState<Steuersatz[]>([]);
  const [ladend, setLadend] = useState(true);
  const [ladeFehler, setLadeFehler] = useState<string | null>(null);
  const [neuBezeichnung, setNeuBezeichnung] = useState('');
  const [neuSatz, setNeuSatz] = useState('');
  const [anlegend, setAnlegend] = useState(false);
  const [anlegenFehler, setAnlegenFehler] = useState<string | null>(null);
  const [aktionFehler, setAktionFehler] = useState<string | null>(null);

  async function laden() {
    setLadend(true);
    setLadeFehler(null);
    try {
      setSteuersaetze(await api.get<Steuersatz[]>('/steuersaetze'));
    } catch (err) {
      setLadeFehler(err instanceof ApiError ? err.message : 'Steuersätze konnten nicht geladen werden.');
    } finally {
      setLadend(false);
    }
  }

  useEffect(() => {
    laden();
  }, []);

  async function anlegen(e: FormEvent) {
    e.preventDefault();
    setAnlegenFehler(null);
    setAnlegend(true);
    try {
      const neu = await api.post<Steuersatz>('/steuersaetze', { bezeichnung: neuBezeichnung, satz: neuSatz });
      setSteuersaetze((liste) => [...liste, neu]);
      setNeuBezeichnung('');
      setNeuSatz('');
    } catch (err) {
      setAnlegenFehler(err instanceof ApiError ? err.message : 'Anlegen fehlgeschlagen.');
    } finally {
      setAnlegend(false);
    }
  }

  async function alsStandardSetzen(id: string) {
    setAktionFehler(null);
    try {
      await api.patch<Steuersatz>(`/steuersaetze/${id}`, { istStandard: true });
      await laden();
    } catch (err) {
      setAktionFehler(err instanceof ApiError ? err.message : 'Aktion fehlgeschlagen.');
    }
  }

  async function aktivToggeln(s: Steuersatz) {
    setAktionFehler(null);
    try {
      await api.patch<Steuersatz>(`/steuersaetze/${s.id}`, { aktiv: !s.aktiv });
      await laden();
    } catch (err) {
      setAktionFehler(err instanceof ApiError ? err.message : 'Aktion fehlgeschlagen.');
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Neuer Steuersatz</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={anlegen} className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="stbezeichnung">Bezeichnung</Label>
              <Input
                id="stbezeichnung"
                value={neuBezeichnung}
                onChange={(e) => setNeuBezeichnung(e.target.value)}
                required
              />
            </div>
            <div className="w-28 space-y-1.5">
              <Label htmlFor="stsatz">Satz (%)</Label>
              <Input id="stsatz" value={neuSatz} onChange={(e) => setNeuSatz(e.target.value)} required />
            </div>
            <Button type="submit" disabled={anlegend}>
              <Plus className="mr-2 h-4 w-4" />
              Anlegen
            </Button>
          </form>
          {anlegenFehler && <p className="mt-2 text-sm text-destructive">{anlegenFehler}</p>}
        </CardContent>
      </Card>

      {ladeFehler && <p className="text-sm text-destructive">{ladeFehler}</p>}
      {aktionFehler && <p className="text-sm text-destructive">{aktionFehler}</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bezeichnung</TableHead>
            <TableHead>Satz</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-40" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {ladend && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                Lädt…
              </TableCell>
            </TableRow>
          )}
          {!ladend &&
            steuersaetze.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.bezeichnung}</TableCell>
                <TableCell>{s.satz}%</TableCell>
                <TableCell>{s.aktiv ? 'Aktiv' : 'Deaktiviert'}</TableCell>
                <TableCell className="flex justify-end gap-2">
                  {s.istStandard ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3.5 w-3.5 fill-current" /> Standard
                    </span>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => alsStandardSetzen(s.id)} disabled={!s.aktiv}>
                      Als Standard
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => aktivToggeln(s)}
                    disabled={s.istStandard && s.aktiv}
                  >
                    {s.aktiv ? 'Deaktivieren' : 'Aktivieren'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}

function NummernkreiseTab() {
  const [kreise, setKreise] = useState<Nummernkreis[]>([]);
  const [ladend, setLadend] = useState(true);
  const [ladeFehler, setLadeFehler] = useState<string | null>(null);
  const [aktionFehler, setAktionFehler] = useState<string | null>(null);
  const [entwurf, setEntwurf] = useState<Record<string, { prefix: string; stellen: number; startValue: number }>>({});
  const [speicherndKey, setSpeicherndKey] = useState<string | null>(null);

  async function laden() {
    setLadend(true);
    setLadeFehler(null);
    try {
      const liste = await api.get<Nummernkreis[]>('/nummernkreise');
      setKreise(liste);
      setEntwurf(
        Object.fromEntries(
          liste.map((k) => [k.entityKey, { prefix: k.prefix, stellen: k.stellen, startValue: k.startValue }]),
        ),
      );
    } catch (err) {
      setLadeFehler(err instanceof ApiError ? err.message : 'Nummernkreise konnten nicht geladen werden.');
    } finally {
      setLadend(false);
    }
  }

  useEffect(() => {
    laden();
  }, []);

  async function speichern(k: Nummernkreis) {
    const e = entwurf[k.entityKey];
    if (!e) return;
    setAktionFehler(null);
    setSpeicherndKey(k.entityKey);
    try {
      const body: Record<string, unknown> = { prefix: e.prefix, stellen: e.stellen };
      // startValue nur mitschicken, wenn tatsaechlich geaendert - der Backend-
      // Service lehnt die Aenderung sonst ab, sobald der Kreis schon benutzt
      // wurde (siehe nummernkreis.service.ts), auch wenn der Wert gleich bleibt.
      if (e.startValue !== k.startValue) body.startValue = e.startValue;
      await api.patch<Nummernkreis>(`/nummernkreise/${k.entityKey}`, body);
      await laden();
    } catch (err) {
      setAktionFehler(err instanceof ApiError ? err.message : 'Speichern fehlgeschlagen.');
    } finally {
      setSpeicherndKey(null);
    }
  }

  if (ladend) return <p className="text-sm text-muted-foreground">Lädt…</p>;
  if (ladeFehler) return <p className="text-sm text-destructive">{ladeFehler}</p>;

  return (
    <div className="max-w-3xl space-y-4">
      {aktionFehler && <p className="text-sm text-destructive">{aktionFehler}</p>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bereich</TableHead>
            <TableHead>Präfix</TableHead>
            <TableHead>Stellen</TableHead>
            <TableHead>Startwert</TableHead>
            <TableHead>Nächste Nummer</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {kreise.map((k) => {
            const e = entwurf[k.entityKey] ?? { prefix: k.prefix, stellen: k.stellen, startValue: k.startValue };
            const bereitsBenutzt = k.nextValue !== k.startValue;
            return (
              <TableRow key={k.entityKey}>
                <TableCell>{k.label}</TableCell>
                <TableCell>
                  <Input
                    className="w-24"
                    value={e.prefix}
                    onChange={(ev) =>
                      setEntwurf((d) => ({ ...d, [k.entityKey]: { ...e, prefix: ev.target.value } }))
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    className="w-20"
                    type="number"
                    min={1}
                    max={15}
                    value={e.stellen}
                    onChange={(ev) =>
                      setEntwurf((d) => ({ ...d, [k.entityKey]: { ...e, stellen: Number(ev.target.value) } }))
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    className="w-24"
                    type="number"
                    min={1}
                    value={e.startValue}
                    disabled={bereitsBenutzt}
                    title={bereitsBenutzt ? 'Bereits mindestens eine Nummer vergeben - nicht mehr änderbar.' : undefined}
                    onChange={(ev) =>
                      setEntwurf((d) => ({ ...d, [k.entityKey]: { ...e, startValue: Number(ev.target.value) } }))
                    }
                  />
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {k.prefix}
                  {String(k.nextValue).padStart(k.stellen, '0')}
                </TableCell>
                <TableCell>
                  <Button size="sm" onClick={() => speichern(k)} disabled={speicherndKey === k.entityKey}>
                    {speicherndKey === k.entityKey ? 'Speichert…' : 'Speichern'}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
