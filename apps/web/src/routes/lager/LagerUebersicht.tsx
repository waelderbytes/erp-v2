import { FormEvent, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { api, ApiError } from '@/lib/api';
import { Artikel, Lager, Lagerbestand } from '@/lib/types';
import { PageHeading } from '@/components/ui/page-heading';

export function LagerUebersicht() {
  const [lager, setLager] = useState<Lager[]>([]);
  const [artikel, setArtikel] = useState<Artikel[]>([]);
  const [ladend, setLadend] = useState(true);
  const [ladeFehler, setLadeFehler] = useState<string | null>(null);
  const [dialogOffen, setDialogOffen] = useState(false);

  async function laden() {
    setLadend(true);
    setLadeFehler(null);
    try {
      const [lagerListe, artikelListe] = await Promise.all([api.get<Lager[]>('/lager'), api.get<Artikel[]>('/artikel')]);
      setLager(lagerListe);
      setArtikel(artikelListe);
    } catch (err) {
      setLadeFehler(err instanceof ApiError ? err.message : 'Daten konnten nicht geladen werden.');
    } finally {
      setLadend(false);
    }
  }

  useEffect(() => {
    laden();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeading eyebrow="Warenwirtschaft" title="Lager" />
        <Dialog open={dialogOffen} onOpenChange={setDialogOffen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Neues Lager
            </Button>
          </DialogTrigger>
          <LagerAnlegenDialog
            onErfolg={() => {
              setDialogOffen(false);
              laden();
            }}
          />
        </Dialog>
      </div>

      {ladeFehler && <p className="text-sm text-destructive">{ladeFehler}</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bezeichnung</TableHead>
            <TableHead>Standardlager</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ladend && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                Lädt…
              </TableCell>
            </TableRow>
          )}
          {!ladend && lager.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                Noch keine Lager angelegt.
              </TableCell>
            </TableRow>
          )}
          {lager.map((l) => (
            <TableRow key={l.id}>
              <TableCell>{l.bezeichnung}</TableCell>
              <TableCell>{l.istStandard ? 'Ja' : ''}</TableCell>
              <TableCell>{l.aktiv ? 'Aktiv' : 'Inaktiv'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {!ladend && lager.length > 0 && artikel.length > 0 && (
        <BewegungBuchen lager={lager} artikel={artikel} onGebucht={laden} />
      )}

      {!ladend && artikel.length > 0 && <BestandAnzeigen artikel={artikel} />}
    </div>
  );
}

function LagerAnlegenDialog({ onErfolg }: { onErfolg: () => void }) {
  const [bezeichnung, setBezeichnung] = useState('');
  const [istStandard, setIstStandard] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [speichernd, setSpeichernd] = useState(false);

  async function absenden(e: FormEvent) {
    e.preventDefault();
    setFehler(null);
    setSpeichernd(true);
    try {
      await api.post('/lager', { bezeichnung, istStandard });
      onErfolg();
    } catch (err) {
      setFehler(err instanceof ApiError ? err.message : 'Lager konnte nicht angelegt werden.');
    } finally {
      setSpeichernd(false);
    }
  }

  return (
    <DialogContent>
      <form onSubmit={absenden}>
        <DialogHeader>
          <DialogTitle>Neues Lager</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bezeichnung">Bezeichnung</Label>
            <Input id="bezeichnung" value={bezeichnung} onChange={(e) => setBezeichnung(e.target.value)} required autoFocus />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={istStandard} onChange={(e) => setIstStandard(e.target.checked)} />
            Als Standardlager setzen
          </label>
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

function BewegungBuchen({ lager, artikel, onGebucht }: { lager: Lager[]; artikel: Artikel[]; onGebucht: () => void }) {
  const [artikelId, setArtikelId] = useState(artikel[0]?.id ?? '');
  const [lagerId, setLagerId] = useState(lager[0]?.id ?? '');
  const [menge, setMenge] = useState('');
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState<string | null>(null);
  const [speichernd, setSpeichernd] = useState(false);

  async function buchen(typ: 'wareneingang' | 'warenausgang') {
    setFehler(null);
    setErfolg(null);
    if (!artikelId || !lagerId || !menge) {
      setFehler('Bitte Artikel, Lager und Menge angeben.');
      return;
    }
    setSpeichernd(true);
    try {
      await api.post(`/lagerbewegung/${typ}`, { artikelId, lagerId, menge });
      setErfolg(typ === 'wareneingang' ? 'Wareneingang gebucht.' : 'Warenausgang gebucht.');
      setMenge('');
      onGebucht();
    } catch (err) {
      setFehler(err instanceof ApiError ? err.message : 'Buchung fehlgeschlagen.');
    } finally {
      setSpeichernd(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bewegung buchen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Artikel</Label>
            <Select value={artikelId} onValueChange={setArtikelId}>
              <SelectTrigger>
                <SelectValue />
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
          <div className="space-y-1.5">
            <Label>Lager</Label>
            <Select value={lagerId} onValueChange={setLagerId}>
              <SelectTrigger>
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
            Wareneingang buchen
          </Button>
          <Button type="button" variant="outline" disabled={speichernd} onClick={() => buchen('warenausgang')}>
            Warenausgang buchen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function BestandAnzeigen({ artikel }: { artikel: Artikel[] }) {
  const [artikelId, setArtikelId] = useState(artikel[0]?.id ?? '');
  const [bestand, setBestand] = useState<Lagerbestand[]>([]);
  const [ladend, setLadend] = useState(false);

  useEffect(() => {
    if (!artikelId) return;
    setLadend(true);
    api
      .get<Lagerbestand[]>(`/lager/artikel/${artikelId}/bestand`)
      .then(setBestand)
      .finally(() => setLadend(false));
  }, [artikelId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bestand je Artikel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-sm space-y-1.5">
          <Label>Artikel</Label>
          <Select value={artikelId} onValueChange={setArtikelId}>
            <SelectTrigger>
              <SelectValue />
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lager</TableHead>
              <TableHead>Menge</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ladend && (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground">
                  Lädt…
                </TableCell>
              </TableRow>
            )}
            {!ladend && bestand.length === 0 && (
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
      </CardContent>
    </Card>
  );
}
