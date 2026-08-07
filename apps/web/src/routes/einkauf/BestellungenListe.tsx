import { FormEvent, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { api, ApiError } from '@/lib/api';
import { Artikel, Bestellung, Lager, Lieferant } from '@/lib/types';

const STATUS_LABEL: Record<string, string> = {
  offen: 'Offen',
  bestellt: 'Bestellt',
  teilweise_geliefert: 'Teilweise geliefert',
  abgeschlossen: 'Abgeschlossen',
  storniert: 'Storniert',
};

export function BestellungenListe() {
  const [bestellungen, setBestellungen] = useState<Bestellung[]>([]);
  const [lieferanten, setLieferanten] = useState<Lieferant[]>([]);
  const [artikel, setArtikel] = useState<Artikel[]>([]);
  const [lager, setLager] = useState<Lager[]>([]);
  const [ladend, setLadend] = useState(true);
  const [ladeFehler, setLadeFehler] = useState<string | null>(null);
  const [dialogOffen, setDialogOffen] = useState(false);
  const [ausgewaehlteId, setAusgewaehlteId] = useState<string | null>(null);

  async function laden() {
    setLadend(true);
    setLadeFehler(null);
    try {
      const [b, l, a, lg] = await Promise.all([
        api.get<Bestellung[]>('/bestellungen'),
        api.get<Lieferant[]>('/lieferanten'),
        api.get<Artikel[]>('/artikel'),
        api.get<Lager[]>('/lager'),
      ]);
      setBestellungen(b);
      setLieferanten(l);
      setArtikel(a);
      setLager(lg);
    } catch (err) {
      setLadeFehler(err instanceof ApiError ? err.message : 'Daten konnten nicht geladen werden.');
    } finally {
      setLadend(false);
    }
  }

  useEffect(() => {
    laden();
  }, []);

  const ausgewaehlt = bestellungen.find((b) => b.id === ausgewaehlteId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Bestellungen</h1>
        <Dialog open={dialogOffen} onOpenChange={setDialogOffen}>
          <DialogTrigger asChild>
            <Button disabled={lieferanten.length === 0 || artikel.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Neue Bestellung
            </Button>
          </DialogTrigger>
          <BestellungAnlegenDialog
            lieferanten={lieferanten}
            artikel={artikel}
            onErfolg={() => {
              setDialogOffen(false);
              laden();
            }}
          />
        </Dialog>
      </div>

      {ladeFehler && <p className="text-sm text-destructive">{ladeFehler}</p>}
      {lieferanten.length === 0 && !ladend && (
        <p className="text-sm text-muted-foreground">Erst einen Lieferanten anlegen, bevor eine Bestellung möglich ist.</p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bestellnummer</TableHead>
            <TableHead>Lieferant</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Datum</TableHead>
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
          {!ladend && bestellungen.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                Noch keine Bestellungen angelegt.
              </TableCell>
            </TableRow>
          )}
          {bestellungen.map((b) => (
            <TableRow key={b.id} className="cursor-pointer" onClick={() => setAusgewaehlteId(b.id)}>
              <TableCell className="font-mono">{b.bestellnummer}</TableCell>
              <TableCell>{b.lieferant?.firmenname ?? '–'}</TableCell>
              <TableCell>{STATUS_LABEL[b.status] ?? b.status}</TableCell>
              <TableCell>{b.bestelldatum}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {ausgewaehlt && (
        <BestellungDetail
          bestellungId={ausgewaehlt.id}
          lager={lager}
          onAktualisiert={laden}
        />
      )}
    </div>
  );
}

interface PositionZeile {
  artikelId: string;
  menge: string;
}

function BestellungAnlegenDialog({
  lieferanten,
  artikel,
  onErfolg,
}: {
  lieferanten: Lieferant[];
  artikel: Artikel[];
  onErfolg: () => void;
}) {
  const [lieferantId, setLieferantId] = useState(lieferanten[0]?.id ?? '');
  const [positionen, setPositionen] = useState<PositionZeile[]>([{ artikelId: artikel[0]?.id ?? '', menge: '' }]);
  const [fehler, setFehler] = useState<string | null>(null);
  const [speichernd, setSpeichernd] = useState(false);

  function positionAendern(index: number, feld: keyof PositionZeile, wert: string) {
    setPositionen((prev) => prev.map((p, i) => (i === index ? { ...p, [feld]: wert } : p)));
  }

  async function absenden(e: FormEvent) {
    e.preventDefault();
    setFehler(null);
    const gueltigePositionen = positionen.filter((p) => p.artikelId && p.menge);
    if (gueltigePositionen.length === 0) {
      setFehler('Mindestens eine Position mit Artikel und Menge angeben.');
      return;
    }
    setSpeichernd(true);
    try {
      await api.post('/bestellungen', { lieferantId, positionen: gueltigePositionen });
      onErfolg();
    } catch (err) {
      setFehler(err instanceof ApiError ? err.message : 'Bestellung konnte nicht angelegt werden.');
    } finally {
      setSpeichernd(false);
    }
  }

  return (
    <DialogContent className="max-w-xl">
      <form onSubmit={absenden}>
        <DialogHeader>
          <DialogTitle>Neue Bestellung</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Lieferant</Label>
            <Select value={lieferantId} onValueChange={setLieferantId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {lieferanten.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.firmenname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Positionen</Label>
            {positionen.map((p, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1 space-y-1.5">
                  <Select value={p.artikelId} onValueChange={(v) => positionAendern(i, 'artikelId', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Artikel" />
                    </SelectTrigger>
                    <SelectContent>
                      {artikel.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.artikelnummer} – {a.bezeichnung}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  className="w-24"
                  placeholder="Menge"
                  value={p.menge}
                  onChange={(e) => positionAendern(i, 'menge', e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setPositionen((prev) => prev.filter((_, idx) => idx !== i))}
                  disabled={positionen.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPositionen((prev) => [...prev, { artikelId: artikel[0]?.id ?? '', menge: '' }])}
            >
              <Plus className="mr-1 h-3 w-3" />
              Position hinzufügen
            </Button>
          </div>

          {fehler && <p className="text-sm text-destructive">{fehler}</p>}
        </div>
        <DialogFooter>
          <Button type="submit" disabled={speichernd}>
            {speichernd ? 'Speichert…' : 'Anlegen'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function BestellungDetail({
  bestellungId,
  lager,
  onAktualisiert,
}: {
  bestellungId: string;
  lager: Lager[];
  onAktualisiert: () => void;
}) {
  const [detail, setDetail] = useState<Bestellung | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);

  async function laden() {
    try {
      setDetail(await api.get<Bestellung>(`/bestellungen/${bestellungId}`));
    } catch (err) {
      setFehler(err instanceof ApiError ? err.message : 'Bestellung konnte nicht geladen werden.');
    }
  }

  useEffect(() => {
    laden();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bestellungId]);

  async function bestellen() {
    setFehler(null);
    try {
      await api.post(`/bestellungen/${bestellungId}/bestellen`);
      await laden();
      onAktualisiert();
    } catch (err) {
      setFehler(err instanceof ApiError ? err.message : 'Aktion fehlgeschlagen.');
    }
  }

  if (!detail) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Bestellung {detail.bestellnummer} – {STATUS_LABEL[detail.status] ?? detail.status}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fehler && <p className="text-sm text-destructive">{fehler}</p>}
        {detail.status === 'offen' && (
          <Button size="sm" onClick={bestellen}>
            Bestellen
          </Button>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Artikel</TableHead>
              <TableHead>Menge</TableHead>
              <TableHead>Geliefert</TableHead>
              <TableHead>Wareneingang buchen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detail.positionen?.map((p) => (
              <PositionZeileMitBuchung
                key={p.id}
                positionId={p.id}
                bezeichnung={p.artikel ? `${p.artikel.artikelnummer} – ${p.artikel.bezeichnung}` : p.artikelId}
                menge={p.menge}
                gelieferteMenge={p.gelieferteMenge}
                lager={lager}
                onGebucht={async () => {
                  await laden();
                  onAktualisiert();
                }}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function PositionZeileMitBuchung({
  positionId,
  bezeichnung,
  menge,
  gelieferteMenge,
  lager,
  onGebucht,
}: {
  positionId: string;
  bezeichnung: string;
  menge: string;
  gelieferteMenge: string;
  lager: Lager[];
  onGebucht: () => void;
}) {
  const [lagerId, setLagerId] = useState(lager[0]?.id ?? '');
  const [buchMenge, setBuchMenge] = useState('');
  const [fehler, setFehler] = useState<string | null>(null);
  const restmenge = Number(menge) - Number(gelieferteMenge);

  async function buchen() {
    setFehler(null);
    try {
      await api.post('/bestellungen/wareneingang', { positionId, lagerId, menge: buchMenge });
      setBuchMenge('');
      onGebucht();
    } catch (err) {
      setFehler(err instanceof ApiError ? err.message : 'Buchung fehlgeschlagen.');
    }
  }

  return (
    <TableRow>
      <TableCell>{bezeichnung}</TableCell>
      <TableCell>{menge}</TableCell>
      <TableCell>{gelieferteMenge}</TableCell>
      <TableCell>
        {restmenge <= 0 ? (
          <span className="text-muted-foreground">vollständig geliefert</span>
        ) : (
          <div className="flex items-center gap-2">
            <Select value={lagerId} onValueChange={setLagerId}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {lager.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.bezeichnung}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input className="w-20" placeholder="Menge" value={buchMenge} onChange={(e) => setBuchMenge(e.target.value)} />
            <Button size="sm" onClick={buchen} disabled={!buchMenge}>
              Buchen
            </Button>
            {fehler && <span className="text-xs text-destructive">{fehler}</span>}
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
