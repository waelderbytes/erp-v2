// Generische Listen-Ansicht fuer die Belegkette (Angebote/Auftragsbestaetigungen/
// Lieferscheine/Rechnungen) - EIN Component-Body, vier duenne Wrapper-Exports
// fuer die Routen (siehe App.tsx). Zeigt bewusst KEINE Summenspalte - die
// Listen-Endpoint laedt keine Positionen (siehe beleg.service.ts::liste()),
// Summen gibt es in der Detailansicht.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeading } from '@/components/ui/page-heading';
import { api, ApiError } from '@/lib/api';
import { Beleg, BelegTyp, Kunde } from '@/lib/types';
import { BELEG_STATUS_LABEL, BELEG_TYP_LABEL_PLURAL, BELEG_TYP_PFAD } from '@/lib/beleg-labels';

function kundenName(k?: Kunde): string {
  if (!k) return '–';
  return k.typ === 'firma' ? (k.firmenname ?? '–') : `${k.vorname ?? ''} ${k.nachname ?? ''}`.trim() || '–';
}

function BelegeListeGeneric({ belegTyp }: { belegTyp: BelegTyp }) {
  const navigate = useNavigate();
  const pfad = BELEG_TYP_PFAD[belegTyp];
  const [belege, setBelege] = useState<Beleg[]>([]);
  const [ladend, setLadend] = useState(true);
  const [ladeFehler, setLadeFehler] = useState<string | null>(null);

  useEffect(() => {
    setLadend(true);
    setLadeFehler(null);
    api
      .get<Beleg[]>(`/belege/${belegTyp}`)
      .then(setBelege)
      .catch((err) => setLadeFehler(err instanceof ApiError ? err.message : 'Belege konnten nicht geladen werden.'))
      .finally(() => setLadend(false));
  }, [belegTyp]);

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Vertrieb"
        title={BELEG_TYP_LABEL_PLURAL[belegTyp]}
        actions={
          <Button onClick={() => navigate(`/${pfad}/neu`)}>
            <Plus className="mr-2 h-4 w-4" />
            Neu
          </Button>
        }
      />

      {ladeFehler && <p className="text-sm text-destructive">{ladeFehler}</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nummer</TableHead>
            <TableHead>Datum</TableHead>
            <TableHead>Kunde</TableHead>
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
          {!ladend && belege.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                Noch keine Einträge.
              </TableCell>
            </TableRow>
          )}
          {belege.map((b) => (
            <TableRow key={b.id} className="cursor-pointer" onClick={() => navigate(`/${pfad}/${b.id}`)}>
              <TableCell className="font-mono text-sm">{b.belegnummer}</TableCell>
              <TableCell>{b.belegdatum}</TableCell>
              <TableCell>{kundenName(b.kunde)}</TableCell>
              <TableCell>{BELEG_STATUS_LABEL[b.status]}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function AngeboteListe() {
  return <BelegeListeGeneric belegTyp="angebot" />;
}
export function AuftraegeListe() {
  return <BelegeListeGeneric belegTyp="auftragsbestaetigung" />;
}
export function LieferscheineListe() {
  return <BelegeListeGeneric belegTyp="lieferschein" />;
}
export function RechnungenListe() {
  return <BelegeListeGeneric belegTyp="rechnung" />;
}
export function ProformarechnungenListe() {
  return <BelegeListeGeneric belegTyp="proforma" />;
}
export function AbschlagsrechnungenListe() {
  return <BelegeListeGeneric belegTyp="abschlag" />;
}
