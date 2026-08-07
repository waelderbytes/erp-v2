import { FormEvent, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { api, ApiError } from '@/lib/api';
import { Artikel, Artikelart } from '@/lib/types';

type SortSpalte = 'artikelnummer' | 'bezeichnung' | 'artikelart' | 'hersteller';

export function ArtikelListe() {
  const navigate = useNavigate();
  const [artikel, setArtikel] = useState<Artikel[]>([]);
  const [ladend, setLadend] = useState(true);
  const [ladeFehler, setLadeFehler] = useState<string | null>(null);
  const [dialogOffen, setDialogOffen] = useState(false);
  const [suche, setSuche] = useState('');
  const [sortSpalte, setSortSpalte] = useState<SortSpalte>('artikelnummer');
  const [sortAufsteigend, setSortAufsteigend] = useState(true);

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

  function sortieren(spalte: SortSpalte) {
    if (spalte === sortSpalte) {
      setSortAufsteigend((a) => !a);
    } else {
      setSortSpalte(spalte);
      setSortAufsteigend(true);
    }
  }

  const angezeigt = useMemo(() => {
    const suchbegriff = suche.trim().toLowerCase();
    const gefiltert = suchbegriff
      ? artikel.filter((a) =>
          [a.artikelnummer, a.bezeichnung, a.hersteller, a.herstellerArtikelnummer, a.eanGtin]
            .filter(Boolean)
            .some((feld) => feld!.toLowerCase().includes(suchbegriff)),
        )
      : artikel;

    const sortiert = [...gefiltert].sort((a, b) => {
      const wa = (a[sortSpalte] ?? '').toString().toLowerCase();
      const wb = (b[sortSpalte] ?? '').toString().toLowerCase();
      return wa < wb ? -1 : wa > wb ? 1 : 0;
    });
    return sortAufsteigend ? sortiert : sortiert.reverse();
  }, [artikel, suche, sortSpalte, sortAufsteigend]);

  function SortHeader({ spalte, children }: { spalte: SortSpalte; children: React.ReactNode }) {
    const aktiv = sortSpalte === spalte;
    return (
      <TableHead>
        <button
          type="button"
          onClick={() => sortieren(spalte)}
          className="flex items-center gap-1 font-medium hover:text-foreground"
        >
          {children}
          {aktiv ? (
            sortAufsteigend ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-40" />
          )}
        </button>
      </TableHead>
    );
  }

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

      <Input
        placeholder="Suche nach Nummer, Bezeichnung, Hersteller, EAN…"
        value={suche}
        onChange={(e) => setSuche(e.target.value)}
        className="max-w-sm"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <SortHeader spalte="artikelnummer">Artikelnummer</SortHeader>
            <SortHeader spalte="bezeichnung">Bezeichnung</SortHeader>
            <SortHeader spalte="artikelart">Art</SortHeader>
            <SortHeader spalte="hersteller">Hersteller</SortHeader>
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
          {!ladend && angezeigt.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                {artikel.length === 0 ? 'Noch keine Artikel angelegt.' : 'Keine Treffer für diese Suche.'}
              </TableCell>
            </TableRow>
          )}
          {angezeigt.map((a) => (
            <TableRow
              key={a.id}
              onClick={() => navigate(`/artikel/${a.id}`)}
              className={cn('cursor-pointer', !a.aktiv && 'opacity-60')}
            >
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
  const [beschreibung, setBeschreibung] = useState('');
  const [einheit, setEinheit] = useState('');
  const [eanGtin, setEanGtin] = useState('');
  const [bestandsgefuehrt, setBestandsgefuehrt] = useState(false);
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
        beschreibung: beschreibung || undefined,
        einheit: einheit || undefined,
        eanGtin: eanGtin || undefined,
        bestandsgefuehrt: artikelart === 'dienstleistung' ? undefined : bestandsgefuehrt,
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
    <DialogContent className="max-w-lg">
      <form onSubmit={absenden}>
        <DialogHeader>
          <DialogTitle>Neuer Artikel</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
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
