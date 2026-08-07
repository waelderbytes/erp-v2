// Singleton-Tabelle (genau 1 Zeile) fuer Firmeneinstellungen, die das Artikelstamm-
// Modul direkt braucht. Vollstaendiges Modul "Stammdaten/System-Einstellungen" folgt
// spaeter - hier bewusst nur das Minimum, das fuer die Artikelnummern-Vergabe noetig
// ist (siehe docs/architecture.md Abschnitt 6, "Artikelnummern-Schema").
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('firma')
export class Firma {
  // Feste ID, da Singleton - vermeidet eine zusaetzliche "gibt es schon eine Zeile"-
  // Abfrage mit Race-Condition-Potenzial beim allerersten Anlegen.
  @PrimaryColumn({ default: 1 })
  id: number;

  @Column({ name: 'artikelnummern_schema', default: 'einfach' })
  artikelnummernSchema: 'einfach' | 'kategorie';

  @Column({ name: 'artikelnummern_stellen', default: 5 })
  artikelnummernStellen: number;
}
