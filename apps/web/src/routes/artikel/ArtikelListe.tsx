import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { api, ApiError } from '@/lib/api';
import { Artikel } from '@/lib/types';
import { PageHeading } from '@/components/ui/page-heading';

type SortSpalte = 'artikelnummer' | 'bezeichnung' | 'artikelart' | 'hersteller';

export function ArtikelListe() {
  const navigate = useNavigate();
  const [artikel, setArtikel] = useState<Artikel[]>([]);
  const [ladend, setLadend] = useState(true);
  const [ladeFehler, setLadeFehler] = useState<string | null>(null);
  const [suche, setSuche] = useState('');
  const [sortSpalte, setSortSpalte] = useState<SortSpalte>('artikelnummer');
  const [sortAufsteigend, setSortAufsteigend] = useState(true);

  useEffect(() => {
    (async () => {
      setLadend(true);
      setLadeFehler(null);
      try {
        setArtikel(await api.get<Artikel[]>('/artikel'));
      } catch (err) {
        setLadeFehler(err instanceof ApiError ? err.message : 'Artikel konnten nicht geladen werden.');
      } finally {
        setLadend(false);
      }
    })();
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
        <PageHeading eyebrow="Warenwirtschaft" title="Artikel" />
        {/* Kein Dialog mehr - "Neuer Artikel" fuehrt auf denselben Tab-Screen wie
            das Bearbeiten (siehe ArtikelDetail.tsx), Muster aus ERP v1
            uebernommen: erster Tab "Stammdaten" speichert, danach schalten
            sich die weiteren Tabs (Bestand/Preise/Lieferanten/Sprachen) frei. */}
        <Button onClick={() => navigate('/artikel/neu')}>
          <Plus className="mr-2 h-4 w-4" />
          Neuer Artikel
        </Button>
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
