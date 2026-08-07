import { FormEvent, useEffect, useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { api, ApiError } from '@/lib/api';
import { Benutzer, Rolle } from '@/lib/types';

function benutzerName(b: Benutzer): string {
  return `${b.vorname ?? ''} ${b.nachname ?? ''}`.trim() || '–';
}

export function BenutzerListe() {
  const [benutzer, setBenutzer] = useState<Benutzer[]>([]);
  const [rollen, setRollen] = useState<Rolle[]>([]);
  const [ladend, setLadend] = useState(true);
  const [ladeFehler, setLadeFehler] = useState<string | null>(null);
  const [anlegenOffen, setAnlegenOffen] = useState(false);
  const [bearbeiten, setBearbeiten] = useState<Benutzer | null>(null);

  async function laden() {
    setLadend(true);
    setLadeFehler(null);
    try {
      const [b, r] = await Promise.all([api.get<Benutzer[]>('/benutzer'), api.get<Rolle[]>('/rollen')]);
      setBenutzer(b);
      setRollen(r);
    } catch (err) {
      setLadeFehler(err instanceof ApiError ? err.message : 'Benutzer konnten nicht geladen werden.');
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
        <h1 className="text-xl font-semibold">Benutzer</h1>
        <Dialog open={anlegenOffen} onOpenChange={setAnlegenOffen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Neuer Benutzer
            </Button>
          </DialogTrigger>
          <BenutzerAnlegenDialog
            rollen={rollen}
            onErfolg={() => {
              setAnlegenOffen(false);
              laden();
            }}
          />
        </Dialog>
      </div>

      {ladeFehler && <p className="text-sm text-destructive">{ladeFehler}</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>E-Mail</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Rollen</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {ladend && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Lädt…
              </TableCell>
            </TableRow>
          )}
          {!ladend && benutzer.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Noch keine Benutzer angelegt.
              </TableCell>
            </TableRow>
          )}
          {benutzer.map((b) => (
            <TableRow key={b.id}>
              <TableCell className="font-mono">{b.email}</TableCell>
              <TableCell>{benutzerName(b)}</TableCell>
              <TableCell>{b.rollen.length > 0 ? b.rollen.map((r) => r.name).join(', ') : '–'}</TableCell>
              <TableCell>{b.aktiv ? 'Aktiv' : 'Inaktiv'}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" onClick={() => setBearbeiten(b)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={bearbeiten !== null} onOpenChange={(offen) => !offen && setBearbeiten(null)}>
        {bearbeiten && (
          <BenutzerBearbeitenDialog
            benutzer={bearbeiten}
            rollen={rollen}
            onGeaendert={(aktualisiert) => {
              setBearbeiten(aktualisiert);
              setBenutzer((liste) => liste.map((b) => (b.id === aktualisiert.id ? aktualisiert : b)));
            }}
          />
        )}
      </Dialog>
    </div>
  );
}

function BenutzerAnlegenDialog({ rollen, onErfolg }: { rollen: Rolle[]; onErfolg: () => void }) {
  const [email, setEmail] = useState('');
  const [passwort, setPasswort] = useState('');
  const [vorname, setVorname] = useState('');
  const [nachname, setNachname] = useState('');
  const [rollenIds, setRollenIds] = useState<string[]>([]);
  const [fehler, setFehler] = useState<string | null>(null);
  const [speichernd, setSpeichernd] = useState(false);

  function rolleUmschalten(id: string) {
    setRollenIds((liste) => (liste.includes(id) ? liste.filter((r) => r !== id) : [...liste, id]));
  }

  async function absenden(e: FormEvent) {
    e.preventDefault();
    setFehler(null);
    setSpeichernd(true);
    try {
      await api.post('/benutzer', {
        email,
        passwort,
        vorname,
        nachname,
        rollenIds: rollenIds.length > 0 ? rollenIds : undefined,
      });
      onErfolg();
    } catch (err) {
      setFehler(err instanceof ApiError ? err.message : 'Benutzer konnte nicht angelegt werden.');
    } finally {
      setSpeichernd(false);
    }
  }

  return (
    <DialogContent>
      <form onSubmit={absenden}>
        <DialogHeader>
          <DialogTitle>Neuer Benutzer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
          <div className="space-y-1.5">
            <Label htmlFor="email">E-Mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="passwort">Passwort (mind. 8 Zeichen)</Label>
            <Input id="passwort" type="password" minLength={8} value={passwort} onChange={(e) => setPasswort(e.target.value)} required />
          </div>
          {rollen.length > 0 && (
            <div className="space-y-1.5">
              <Label>Rollen</Label>
              <div className="space-y-1 rounded-md border border-input p-2">
                {rollen.map((r) => (
                  <label key={r.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={rollenIds.includes(r.id)} onChange={() => rolleUmschalten(r.id)} />
                    {r.name}
                  </label>
                ))}
              </div>
            </div>
          )}
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

function BenutzerBearbeitenDialog({
  benutzer,
  rollen,
  onGeaendert,
}: {
  benutzer: Benutzer;
  rollen: Rolle[];
  onGeaendert: (b: Benutzer) => void;
}) {
  const [vorname, setVorname] = useState(benutzer.vorname ?? '');
  const [nachname, setNachname] = useState(benutzer.nachname ?? '');
  const [aktiv, setAktiv] = useState(benutzer.aktiv);
  const [personalnummer, setPersonalnummer] = useState(benutzer.personalnummer ?? '');
  const [neuesPasswort, setNeuesPasswort] = useState('');
  const [neuePin, setNeuePin] = useState('');
  const [fehler, setFehler] = useState<string | null>(null);
  const [speichernd, setSpeichernd] = useState<string | null>(null);

  async function stammdatenSpeichern(e: FormEvent) {
    e.preventDefault();
    setFehler(null);
    setSpeichernd('stammdaten');
    try {
      const aktualisiert = await api.patch<Benutzer>(`/benutzer/${benutzer.id}`, {
        vorname,
        nachname,
        aktiv,
        personalnummer: personalnummer || undefined,
      });
      onGeaendert(aktualisiert);
    } catch (err) {
      setFehler(err instanceof ApiError ? err.message : 'Speichern fehlgeschlagen.');
    } finally {
      setSpeichernd(null);
    }
  }

  async function passwortSetzen(e: FormEvent) {
    e.preventDefault();
    setFehler(null);
    setSpeichernd('passwort');
    try {
      await api.post(`/benutzer/${benutzer.id}/passwort`, { neuesPasswort });
      setNeuesPasswort('');
    } catch (err) {
      setFehler(err instanceof ApiError ? err.message : 'Passwort konnte nicht gesetzt werden.');
    } finally {
      setSpeichernd(null);
    }
  }

  async function pinSetzen(e: FormEvent) {
    e.preventDefault();
    setFehler(null);
    setSpeichernd('pin');
    try {
      await api.post(`/benutzer/${benutzer.id}/pin`, { pin: neuePin });
      setNeuePin('');
    } catch (err) {
      setFehler(err instanceof ApiError ? err.message : 'PIN konnte nicht gesetzt werden.');
    } finally {
      setSpeichernd(null);
    }
  }

  async function rolleUmschalten(rolle: Rolle) {
    const zugewiesen = benutzer.rollen.some((r) => r.id === rolle.id);
    setFehler(null);
    setSpeichernd(`rolle-${rolle.id}`);
    try {
      const aktualisiert = zugewiesen
        ? await api.delete<Benutzer>(`/benutzer/${benutzer.id}/rollen/${rolle.id}`)
        : await api.post<Benutzer>(`/benutzer/${benutzer.id}/rollen`, { rolleId: rolle.id });
      onGeaendert(aktualisiert);
    } catch (err) {
      setFehler(err instanceof ApiError ? err.message : 'Rolle konnte nicht geändert werden.');
    } finally {
      setSpeichernd(null);
    }
  }

  return (
    <DialogContent className="max-w-xl">
      <DialogHeader>
        <DialogTitle>{benutzer.email}</DialogTitle>
      </DialogHeader>
      <div className="space-y-6">
        {fehler && <p className="text-sm text-destructive">{fehler}</p>}

        <form onSubmit={stammdatenSpeichern} className="space-y-3">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Stammdaten</Label>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Vorname" value={vorname} onChange={(e) => setVorname(e.target.value)} />
            <Input placeholder="Nachname" value={nachname} onChange={(e) => setNachname(e.target.value)} />
          </div>
          <Input placeholder="Personalnummer (für Kiosk-Login)" value={personalnummer} onChange={(e) => setPersonalnummer(e.target.value)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={aktiv} onChange={(e) => setAktiv(e.target.checked)} />
            Aktiv
          </label>
          <Button type="submit" size="sm" disabled={speichernd === 'stammdaten'}>
            {speichernd === 'stammdaten' ? 'Speichert…' : 'Stammdaten speichern'}
          </Button>
        </form>

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Rollen</Label>
          <div className="space-y-1 rounded-md border border-input p-2">
            {rollen.map((r) => (
              <label key={r.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={benutzer.rollen.some((br) => br.id === r.id)}
                  disabled={speichernd === `rolle-${r.id}`}
                  onChange={() => rolleUmschalten(r)}
                />
                {r.name}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <form onSubmit={passwortSetzen} className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">Neues Passwort</Label>
            <Input type="password" minLength={8} value={neuesPasswort} onChange={(e) => setNeuesPasswort(e.target.value)} required />
            <Button type="submit" size="sm" variant="secondary" disabled={speichernd === 'passwort'}>
              {speichernd === 'passwort' ? 'Setzt…' : 'Passwort setzen'}
            </Button>
          </form>
          <form onSubmit={pinSetzen} className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">Neue Kiosk-PIN (4-stellig)</Label>
            <Input
              value={neuePin}
              onChange={(e) => setNeuePin(e.target.value)}
              pattern="\\d{4}"
              maxLength={4}
              placeholder="1234"
              required
            />
            <Button type="submit" size="sm" variant="secondary" disabled={speichernd === 'pin'}>
              {speichernd === 'pin' ? 'Setzt…' : 'PIN setzen'}
            </Button>
          </form>
        </div>
      </div>
    </DialogContent>
  );
}
