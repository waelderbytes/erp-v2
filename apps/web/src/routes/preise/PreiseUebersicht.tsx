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
import { Artikel, Artikelpreis, Kunde } from '@/lib/types';
import { PageHeading } from '@/components/ui/page-heading';

export function PreiseUebersicht() {
  const [artikelListe, setArtikelListe] = useState<Artikel[]>([]);
  const [kundenListe, setKundenListe] = useState<Kunde[]>([]);
  const [artikelId, setArtikelId] = useState('');
  const [preise, setPreise] = useState<Artikelpreis[]>([]);
  const [ladend, setLadend] = useState(true);
  const [ladeFehler, setLadeFehler] = useState<string | null>(null);
  const [dialogOffen, setDialogOffen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [a, k] = await Promise.all([api.get<Artikel[]>('/artikel'), api.get<Kunde[]>('/kunden')]);
        setArtikelListe(a);
        setKundenListe(k);
        if (a[0]) setArtikelId(a[0].id);
      } catch (err) {
        setLadeFehler(err instanceof ApiError ? err.message : 'Daten konnten nicht geladen werden.');
      } finally {
        setLadend(false);
      }
    })();
  }, []);

  async function preiseLaden(id: string) {
    if (!id) return;
    try {
      setPreise(await api.get<Artikelpreis[]>(`/preise/artikel/${id}`));
    } catch (err) {
      setLadeFehler(err instanceof ApiError ? err.message : 'Preise konnten nicht geladen werden.');
    }
  }

  useEffect(() => {
    preiseLaden(artikelId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artikelId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeading eyebrow="Warenwirtschaft" title="Preise" />
        <Dialog open={dialogOffen} onOpenChange={setDialogOffen}>
          <DialogTrigger asChild>
            <Button disabled={!artikelId}>
              <Plus className="mr-2 h-4 w-4" />
              Preis anlegen
            </Button>
          </DialogTrigger>
          <PreisAnlegenDialog
            artikelId={artikelId}
            kunden={kundenListe}
            onErfolg={() => {
              setDialogOffen(false);
              preiseLaden(artikelId);
            }}
          />
        </Dialog>
      </div>

      {ladeFehler && <p className="text-sm text-destructive">{ladeFehler}</p>}

      <div className="max-w-sm space-y-1.5">
        <Label>Artikel</Label>
        <Select value={artikelId} onValueChange={setArtikelId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {artikelListe.map((a) => (
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
            <TableHead>Kunde</TableHead>
            <TableHead>Ab Menge</TableHead>
            <TableHead>Preis netto</TableHead>
            <TableHead>Gültig von</TableHead>
            <TableHead>Gültig bis</TableHead>
            <TableHead>Priorität</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!ladend && preise.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Noch keine Preise für diesen Artikel.
              </TableCell>
            </TableRow>
          )}
          {preise.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{kundenListe.find((k) => k.id === p.kundeId)?.firmenname ?? 'Alle Kunden'}</TableCell>
              <TableCell>{p.staffelAbMenge}</TableCell>
              <TableCell>{p.preisNetto} €</TableCell>
              <TableCell>{p.gueltigVon ?? '–'}</TableCell>
              <TableCell>{p.gueltigBis ?? '–'}</TableCell>
              <TableCell>{p.prioritaet}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {artikelId && <PreisErmitteln artikelId={artikelId} kunden={kundenListe} />}
    </div>
  );
}

function PreisAnlegenDialog({
  artikelId,
  kunden,
  onErfolg,
}: {
  artikelId: string;
  kunden: Kunde[];
  onErfolg: () => void;
}) {
  const [kundeId, setKundeId] = useState<string>('alle');
  const [staffelAbMenge, setStaffelAbMenge] = useState('0');
  const [preisNetto, setPreisNetto] = useState('');
  const [gueltigVon, setGueltigVon] = useState('');
  const [gueltigBis, setGueltigBis] = useState('');
  const [fehler, setFehler] = useState<string | null>(null);
  const [speichernd, setSpeichernd] = useState(false);

  async function absenden(e: FormEvent) {
    e.preventDefault();
    setFehler(null);
    setSpeichernd(true);
    try {
      await api.post('/preise', {
        artikelId,
        kundeId: kundeId === 'alle' ? undefined : kundeId,
        staffelAbMenge,
        preisNetto,
        gueltigVon: gueltigVon || undefined,
        gueltigBis: gueltigBis || undefined,
      });
      onErfolg();
    } catch (err) {
      setFehler(err instanceof ApiError ? err.message : 'Preis konnte nicht angelegt werden.');
    } finally {
      setSpeichernd(false);
    }
  }

  return (
    <DialogContent>
      <form onSubmit={absenden}>
        <DialogHeader>
          <DialogTitle>Preis anlegen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
              <Label htmlFor="staffelAbMenge">Ab Menge</Label>
              <Input id="staffelAbMenge" value={staffelAbMenge} onChange={(e) => setStaffelAbMenge(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="preisNetto">Preis netto (€)</Label>
              <Input id="preisNetto" value={preisNetto} onChange={(e) => setPreisNetto(e.target.value)} required autoFocus />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="gueltigVon">Gültig von</Label>
              <Input id="gueltigVon" type="date" value={gueltigVon} onChange={(e) => setGueltigVon(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gueltigBis">Gültig bis</Label>
              <Input id="gueltigBis" type="date" value={gueltigBis} onChange={(e) => setGueltigBis(e.target.value)} />
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

function PreisErmitteln({ artikelId, kunden }: { artikelId: string; kunden: Kunde[] }) {
  const [menge, setMenge] = useState('1');
  const [kundeId, setKundeId] = useState('alle');
  const [ergebnis, setErgebnis] = useState<{ preisNetto: string } | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);

  async function ermitteln() {
    setFehler(null);
    setErgebnis(null);
    const params = new URLSearchParams({ artikelId, menge });
    if (kundeId !== 'alle') params.set('kundeId', kundeId);
    try {
      setErgebnis(await api.get(`/preise/ermitteln?${params.toString()}`));
    } catch (err) {
      setFehler(err instanceof ApiError ? err.message : 'Preis konnte nicht ermittelt werden.');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preis ermitteln (Test)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-3">
          <div className="space-y-1.5">
            <Label>Menge</Label>
            <Input className="w-24" value={menge} onChange={(e) => setMenge(e.target.value)} />
          </div>
          <div className="w-56 space-y-1.5">
            <Label>Kunde</Label>
            <Select value={kundeId} onValueChange={setKundeId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Kein bestimmter Kunde</SelectItem>
                {kunden.map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    {k.firmenname ?? `${k.vorname} ${k.nachname}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" onClick={ermitteln}>
            Ermitteln
          </Button>
        </div>
        {ergebnis && <p className="text-sm">Ergebnis: <span className="font-semibold">{ergebnis.preisNetto} €</span></p>}
        {fehler && <p className="text-sm text-destructive">{fehler}</p>}
      </CardContent>
    </Card>
  );
}
