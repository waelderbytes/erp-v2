import { FormEvent, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { api, ApiError } from '@/lib/api';
import { Lieferant } from '@/lib/types';

export function LieferantenListe() {
  const [lieferanten, setLieferanten] = useState<Lieferant[]>([]);
  const [ladend, setLadend] = useState(true);
  const [ladeFehler, setLadeFehler] = useState<string | null>(null);
  const [dialogOffen, setDialogOffen] = useState(false);

  async function laden() {
    setLadend(true);
    setLadeFehler(null);
    try {
      setLieferanten(await api.get<Lieferant[]>('/lieferanten'));
    } catch (err) {
      setLadeFehler(err instanceof ApiError ? err.message : 'Lieferanten konnten nicht geladen werden.');
    } finally {
      setLadend(false);
    }
  }

  useEffect(() => {
    laden();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Lieferanten</h1>
        <Dialog open={dialogOffen} onOpenChange={setDialogOffen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Neuer Lieferant
            </Button>
          </DialogTrigger>
          <LieferantAnlegenDialog
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
            <TableHead>Lieferantennummer</TableHead>
            <TableHead>Firmenname</TableHead>
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
          {!ladend && lieferanten.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                Noch keine Lieferanten angelegt.
              </TableCell>
            </TableRow>
          )}
          {lieferanten.map((l) => (
            <TableRow key={l.id}>
              <TableCell className="font-mono">{l.lieferantennummer}</TableCell>
              <TableCell>{l.firmenname}</TableCell>
              <TableCell>{l.aktiv ? 'Aktiv' : 'Inaktiv'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function LieferantAnlegenDialog({ onErfolg }: { onErfolg: () => void }) {
  const [firmenname, setFirmenname] = useState('');
  const [strasse, setStrasse] = useState('');
  const [plz, setPlz] = useState('');
  const [ort, setOrt] = useState('');
  const [fehler, setFehler] = useState<string | null>(null);
  const [speichernd, setSpeichernd] = useState(false);

  async function absenden(e: FormEvent) {
    e.preventDefault();
    setFehler(null);
    setSpeichernd(true);
    try {
      await api.post('/lieferanten', {
        firmenname,
        adressen: strasse && plz && ort ? [{ typ: 'versand_von', strasse, plz, ort }] : undefined,
      });
      onErfolg();
    } catch (err) {
      setFehler(err instanceof ApiError ? err.message : 'Lieferant konnte nicht angelegt werden.');
    } finally {
      setSpeichernd(false);
    }
  }

  return (
    <DialogContent>
      <form onSubmit={absenden}>
        <DialogHeader>
          <DialogTitle>Neuer Lieferant</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="firmenname">Firmenname</Label>
            <Input id="firmenname" value={firmenname} onChange={(e) => setFirmenname(e.target.value)} required autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Adresse (optional)</Label>
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
