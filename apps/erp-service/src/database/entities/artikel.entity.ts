// Kernfelder gemaess docs/feldkatalog.md Abschnitt 1.1/1.2. i18n-Mehrsprachigkeit
// (bezeichnung als uebersetzbares Feld) bewusst NICHT Teil dieser ersten Version -
// aktuell einfaches String-Feld, i18n-Tabelle folgt als eigener Schritt (siehe
// Offene Punkte in README dieses Moduls). Ebenso: steuersatz_id/einheit sind noch
// keine FKs auf eigene Stammdaten-Tabellen (die gibt es noch nicht), sondern
// einfache String-Platzhalter - wird nachgezogen, sobald das Modul
// Stammdaten/System-Einstellungen existiert.
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type Artikelart = 'handelsware' | 'dienstleistung' | 'fertigungsartikel';

@Entity('artikel')
export class Artikel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'artikelnummer', unique: true })
  artikelnummer: string;

  @Column({ type: 'varchar' })
  artikelart: Artikelart;

  @Column()
  bezeichnung: string;

  @Column({ type: 'text', nullable: true })
  beschreibung: string | null;

  @Column({ name: 'hauptgruppe_id', nullable: true })
  hauptgruppeId: string | null;

  @Column({ name: 'untergruppe_id', nullable: true })
  untergruppeId: string | null;

  @Column({ nullable: true })
  einheit: string | null;

  @Column({ name: 'ean_gtin', nullable: true })
  eanGtin: string | null;

  // Herstellername, falls abweichend vom Lieferanten - siehe feldkatalog.md
  // Abschnitt 1.2.
  @Column({ nullable: true })
  hersteller: string | null;

  // MPN (Manufacturer Part Number). Global eindeutig (Nutzerentscheidung
  // 08.08.2026) - verhindert doppelt angelegte Artikel fuer dasselbe Produkt.
  // Durchgesetzt per partiellem Unique-Index (siehe Migration), nicht per
  // @Column({unique:true}), weil NULL/nicht vorhandene MPN weiterhin erlaubt
  // bleiben muss (nicht jeder Artikel hat eine Herstellerartikelnummer).
  @Column({ name: 'hersteller_artikelnummer', nullable: true })
  herstellerArtikelnummer: string | null;

  @Column({ default: true })
  aktiv: boolean;

  @Column({ name: 'bestandsgefuehrt', default: false })
  bestandsgefuehrt: boolean;

  @Column({ name: 'custom_fields', type: 'jsonb', nullable: true })
  customFields: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
