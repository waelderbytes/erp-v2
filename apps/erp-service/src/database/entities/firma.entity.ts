// Singleton-Tabelle (genau 1 Zeile) fuer Firmeneinstellungen. Ursprünglich nur das
// Minimum fuer die Artikelnummern-Vergabe (siehe docs/architecture.md Abschnitt 6),
// seit Migration 0016 auch echte Firmenstammdaten (Modul Stammdaten/System-
// Einstellungen, Nutzerentscheidung: erstmal 1 Firma statt Mehrfirmen-Umbau).
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

  // --- Firmenstammdaten (Migration 0016) ---------------------------------
  @Column({ type: 'varchar', length: 200, nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  strasse: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  plz: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ort: string | null;

  @Column({ type: 'varchar', length: 2, default: 'DE' })
  land: string;

  @Column({ name: 'ust_id_nr', type: 'varchar', length: 20, nullable: true })
  ustIdNr: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  steuernummer: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  telefon: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  email: string | null;

  // §19 UStG. Neugruendungen starten automatisch als Kleinunternehmer (siehe
  // module-uebersicht.md) - Schwellenwerte (25.000€ Vorjahresumsatz /
  // 100.000€ laufendes Jahr, tatsaechlicher Umsatz nicht Prognose) werden
  // aktuell NICHT automatisch geprueft, das Flag wird manuell im
  // Stammdaten-Screen umgeschaltet (keine Umsatzauswertung im ERP bisher,
  // die das automatisieren koennte).
  @Column({ default: true })
  kleinunternehmer: boolean;
}
