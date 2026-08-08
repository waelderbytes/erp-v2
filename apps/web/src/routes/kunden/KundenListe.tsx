import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api, ApiError } from '@/lib/api';
import { Kunde } from '@/lib/types';
import { PageHeading } from '@/components/ui/page-heading';

function kundenName(k: Kunde): string {
  return k.typ === 'firma' ? (k.firmenname ?? '–') : `${k.vorname ?? ''} ${k.nachname ?? ''}`.trim() || '–';
}

export function KundenListe() {
  const [kunden, setKunden] = useState<Kunde[]>([]);
  const [ladend, setLadend] = useState(true);
  const [ladeFehler, setLadeFehler] = useState<string | null>(null);
  const [dialogOffen, setDialogOffen] = useState(false);
  const [suche, setSuche] = useState('');

  async function laden() {
    setLadend(true);
    setLadeFehler(null);
    try {
      setKunden(await api.get<Kunde[]>('/kunden'));
    } catch (err) {
      setLadeFehler(err instanceof ApiError ? err.message : 'Kunden konnten nicht geladen werden.');
    } finally {
      setLadend(false);
    }
  }

  useEffect(() => {
    laden();
  }, []);

  const angezeigt = useMemo(() => {
    const suchbegriff = suche.trim().toLowerCase();
    if (!suchbegriff) return kunden;
    return kunden.filter((k) =>
      [k.kundennummer, kundenName(k)].some((feld) => feld.toLowerCase().includes(suchbegriff)),
    );
  }, [kunden, suche]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <PageHeading eyebrow="Warenwirtschaft" title="Kunden" />
        <Dialog open={dialogOffen} onOpenChange={setDialogOffen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Neuer Kunde
            </Button>
          </DialogTrigger>
          <KundeAnlegenDialog
            onErfolg={() => {
              setDialogOffen(false);
              laden();
            }}
          />
        </Dialog>
      </div>

      {ladeFehler && <p className="text-sm text-destructive">{ladeFehler}</p>}

      <Input placeholder="Suche nach Nummer oder Name…" value={suche} onChange={(e) => setSuche(e.target.value)} className="max-w-sm" />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kundennummer</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Typ</TableHead>
            <TableHead>Status</TableHead>
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
          {!ladend && angezeigt.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                {kunden.length === 0 ? 'Noch keine Kunden angelegt.' : 'Keine Treffer für diese Suche.'}
              </TableCell>
            </TableRow>
          )}
          {angezeigt.map((k) => (
            <TableRow key={k.id}>
              <TableCell className="font-mono">{k.kundennummer}</TableCell>
              <TableCell>{kundenName(k)}</TableCell>
              <TableCell>{k.typ === 'firma' ? 'Firma' : 'Privatperson'}</TableCell>
              <TableCell>{k.aktiv ? 'Aktiv' : 'Inaktiv'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function KundeAnlegenDialog({ onErfolg }: { onErfolg: () => void }) {
  const [typ, setTyp] = useState<'firma' | 'privatperson'>('firma');
  const [firmenname, setFirmenname] = useState('');
  const [vorname, setVorname] = useState('');
  const [nachname, setNachname] = useState('');
  const [strasse, setStrasse] = useState('');
  const [plz, setPlz] = useState('');
  const [ort, setOrt] = useState('');
  const [sprache, setSprache] = useState('de');
  const [fehler, setFehler] = useState<string | null>(null);
  const [speichernd, setSpeichernd] = useState(false);

  async function absenden(e: FormEvent) {
    e.preventDefault();
    setFehler(null);
    setSpeichernd(true);
    try {
      await api.post('/kunden', {
        typ,
        firmenname: typ === 'firma' ? firmenname : undefined,
        vorname: typ === 'privatperson' ? vorname : undefined,
        nachname: typ === 'privatperson' ? nachname : undefined,
        sprache,
        adressen:
          strasse && plz && ort
            ? [{ typ: 'rechnung', strasse, plz, ort }]
            : undefined,
      });
      onErfolg();
    } catch (err) {
      setFehler(err instanceof ApiError ? err.message : 'Kunde konnte nicht angelegt werden.');
    } finally {
      setSpeichernd(false);
    }
  }

  return (
    <DialogContent>
      <form onSubmit={absenden}>
        <DialogHeader>
          <DialogTitle>Neuer Kunde</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="typ">Typ</Label>
            <Select value={typ} onValueChange={(v) => setTyp(v as 'firma' | 'privatperson')}>
              <SelectTrigger id="typ">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="firma">Firma</SelectItem>
                <SelectItem value="privatperson">Privatperson</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {typ === 'firma' ? (
            <div className="space-y-1.5">
              <Label htmlFor="firmenname">Firmenname</Label>
              <Input id="firmenname" value={firmenname} onChange={(e) => setFirmenname(e.target.value)} required autoFocus />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="vorname">Vorname</Label>
                <Input id="vorname" value={vorname} onChange={(e) => setVorname(e.target.value)} required autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nachname">Nachname</Label>
                <Input id="nachname" value={nachname} onChange={(e) => setNachname(e.target.value)} required />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="sprache">Sprache (für Belege)</Label>
            <Input id="sprache" className="w-24" maxLength={5} value={sprache} onChange={(e) => setSprache(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Rechnungsadresse (optional)</Label>
            <Input placeholder="Straße" value={strasse} onChange={(e) => setStrasse(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="PLZ" value={plz} onChange={(e) => setPlz(e.target.value)} />
              <Input placeholder="Ort" value={ort} onChange={(e) => setOrt(e.target.value)} />
            </div>
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
