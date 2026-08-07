import { FormEvent, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api, ApiError } from '@/lib/api';
import { Artikel, Artikelart } from '@/lib/types';

export function ArtikelListe() {
  const [artikel, setArtikel] = useState<Artikel[]>([]);
  const [ladend, setLadend] = useState(true);
  const [ladeFehler, setLadeFehler] = useState<string | null>(null);
  const [dialogOffen, setDialogOffen] = useState(false);

  async function laden() {
    setLadend(true);
    setLadeFehler(null);
    try {
      setArtikel(await api.get<Artikel[]>('/artikel'));
    } catch (err) {
      setLadeFehler(err instanceof ApiError ? err.message : 'Artikel konnten nicht geladen werden.');
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
        <h1 className="text-xl font-semibold">Artikel</h1>
        <Dialog open={dialogOffen} onOpenChange={setDialogOffen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Neuer Artikel
            </Button>
          </DialogTrigger>
          <ArtikelAnlegenDialog
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
            <TableHead>Artikelnummer</TableHead>
            <TableHead>Bezeichnung</TableHead>
            <TableHead>Art</TableHead>
            <TableHead>Hersteller</TableHead>
            <TableHead>Hersteller-Art.-Nr.</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ladend && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Lädt…
              </TableCell>
            </TableRow>
          )}
          {!ladend && artikel.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Noch keine Artikel angelegt.
              </TableCell>
            </TableRow>
          )}
          {artikel.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="font-mono">{a.artikelnummer}</TableCell>
              <TableCell>{a.bezeichnung}</TableCell>
              <TableCell>{a.artikelart}</TableCell>
              <TableCell>{a.hersteller ?? '–'}</TableCell>
              <TableCell>{a.herstellerArtikelnummer ?? '–'}</TableCell>
              <TableCell>{a.aktiv ? 'Aktiv' : 'Inaktiv'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ArtikelAnlegenDialog({ onErfolg }: { onErfolg: () => void }) {
  const [artikelart, setArtikelart] = useState<Artikelart>('handelsware');
  const [bezeichnung, setBezeichnung] = useState('');
  const [hersteller, setHersteller] = useState('');
  const [herstellerArtikelnummer, setHerstellerArtikelnummer] = useState('');
  const [fehler, setFehler] = useState<string | null>(null);
  const [speichernd, setSpeichernd] = useState(false);

  async function absenden(e: FormEvent) {
    e.preventDefault();
    setFehler(null);
    setSpeichernd(true);
    try {
      await api.post('/artikel', {
        artikelart,
        bezeichnung,
        hersteller: hersteller || undefined,
        herstellerArtikelnummer: herstellerArtikelnummer || undefined,
      });
      onErfolg();
    } catch (err) {
      setFehler(err instanceof ApiError ? err.message : 'Artikel konnte nicht angelegt werden.');
    } finally {
      setSpeichernd(false);
    }
  }

  return (
    <DialogContent>
      <form onSubmit={absenden}>
        <DialogHeader>
          <DialogTitle>Neuer Artikel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bezeichnung">Bezeichnung</Label>
            <Input id="bezeichnung" value={bezeichnung} onChange={(e) => setBezeichnung(e.target.value)} required autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="hersteller">Hersteller</Label>
              <Input id="hersteller" value={hersteller} onChange={(e) => setHersteller(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="herstellerArtikelnummer">Hersteller-Art.-Nr.</Label>
              <Input id="herstellerArtikelnummer" value={herstellerArtikelnummer} onChange={(e) => setHerstellerArtikelnummer(e.target.value)} />
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
