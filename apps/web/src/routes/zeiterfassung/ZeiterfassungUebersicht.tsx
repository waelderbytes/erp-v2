import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';
import { ArbeitszeitHeute, ZeitbuchungTyp } from '@/lib/types';

// Web-UI fuer die eigene Zeiterfassung (Login per E-Mail/Passwort, siehe
// RequireAuth). Das separate Kiosk-Wandtablet (Personalnummer+PIN, kein
// ERP-Zugang) bekommt eine eigene, unabhaengige Oberflaeche - andere
// Zielgruppe/anderes Geraet, kein Bestandteil dieser normalen ERP-Navigation
// (siehe docs/module-uebersicht.md "Zeiterfassung", noch offen).
const AKTIONEN: Record<'ausgestempelt' | 'eingestempelt' | 'pause', { typ: ZeitbuchungTyp; label: string }[]> = {
  ausgestempelt: [{ typ: 'kommt', label: 'Kommen' }],
  eingestempelt: [
    { typ: 'pause_beginn', label: 'Pause beginnen' },
    { typ: 'geht', label: 'Gehen' },
  ],
  pause: [{ typ: 'pause_ende', label: 'Pause beenden' }],
};

function minutenFormatieren(minuten: number): string {
  const h = Math.floor(minuten / 60);
  const m = Math.round(minuten % 60);
  return `${h}h ${m}min`;
}

const STATUS_LABEL: Record<string, string> = {
  ausgestempelt: 'Ausgestempelt',
  eingestempelt: 'Eingestempelt',
  pause: 'Pause',
};

export function ZeiterfassungUebersicht() {
  const [heute, setHeute] = useState<ArbeitszeitHeute | null>(null);
  const [ladend, setLadend] = useState(true);
  const [fehler, setFehler] = useState<string | null>(null);
  const [stempelnd, setStempelnd] = useState(false);

  async function laden() {
    setLadend(true);
    setFehler(null);
    try {
      setHeute(await api.get<ArbeitszeitHeute>('/zeitbuchung/heute'));
    } catch (err) {
      setFehler(err instanceof ApiError ? err.message : 'Status konnte nicht geladen werden.');
    } finally {
      setLadend(false);
    }
  }

  useEffect(() => {
    laden();
  }, []);

  async function stempeln(typ: ZeitbuchungTyp) {
    setFehler(null);
    setStempelnd(true);
    try {
      await api.post('/zeitbuchung/stempeln', { typ, quelle: 'web' });
      await laden();
    } catch (err) {
      setFehler(err instanceof ApiError ? err.message : 'Buchung fehlgeschlagen.');
    } finally {
      setStempelnd(false);
    }
  }

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-xl font-semibold">Zeiterfassung</h1>

      {fehler && <p className="text-sm text-destructive">{fehler}</p>}

      <Card className="space-y-4 p-6">
        {ladend && <p className="text-sm text-muted-foreground">Lädt…</p>}
        {!ladend && heute && (
          <>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Status</div>
              <div className="text-lg font-semibold">{STATUS_LABEL[heute.status] ?? heute.status}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Arbeitszeit heute</div>
                <div className="text-lg">{minutenFormatieren(heute.arbeitszeitMinuten)}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Pausenzeit heute</div>
                <div className="text-lg">{minutenFormatieren(heute.pausenzeitMinuten)}</div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              {AKTIONEN[heute.status].map((a) => (
                <Button key={a.typ} onClick={() => stempeln(a.typ)} disabled={stempelnd}>
                  {stempelnd ? 'Bucht…' : a.label}
                </Button>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
