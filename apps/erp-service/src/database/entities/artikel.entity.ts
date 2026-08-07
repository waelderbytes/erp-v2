// Kernfelder gemaess docs/feldkatalog.md Abschnitt 1.1/1.2. i18n-Mehrsprachigkeit
// (bezeichnung als uebersetzbares Feld) bewusst NICHT Teil dieser ersten Version -
// aktuell einfaches String-Feld, i18n-Tabelle folgt als eigener Schritt (siehe
// Offene Punkte in README dieses Moduls). Ebenso: steuersatz_id ist noch keine
// FK auf eine eigene Stammdaten-Tabelle (die gibt es noch nicht), sondern ein
// einfacher String-Platzhalter - wird nachgezogen, sobald das Modul
// Stammdaten/System-Einstellungen existiert. Ausnahme seit Migration 0010:
// einheit_id ist bereits eine echte FK (siehe einheit.entity.ts).
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Einheit } from './einheit.entity';

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

  // Migration 0010: vorher freies Textfeld, jetzt echte FK auf die
  // einheit-Tabelle (Vorbild ERP v1, siehe einheit.entity.ts). @JoinColumn
  // ist hier Pflicht, weil zusaetzlich die rohe FK-Spalte einheit_id direkt
  // genutzt wird (siehe Regeln/Lektion in session-handoff.md: ohne
  // @JoinColumn erwartet TypeORM sonst eine implizite Zusatzspalte).
  @Column({ name: 'einheit_id', nullable: true })
  einheitId: string | null;

  @ManyToOne(() => Einheit, { nullable: true })
  @JoinColumn({ name: 'einheit_id' })
  einheit?: Einheit;

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

  // Migration 0011. true nur sinnvoll bei artikelart 'fertigungsartikel'
  // (im Service erzwungen, siehe artikel.service.ts) - Datenmodell-Vorbereitung
  // fuer die Stueckliste (BOM), siehe module-uebersicht.md Abschnitt 1.
  // Stuecklisten-FUNKTIONALITAET selbst kommt erst als eigener Roadmap-Punkt.
  @Column({ default: false })
  bomfaehig: boolean;

  // Migration 0013, Standard-Erweiterungsfelder aus feldkatalog.md Abschnitt
  // 1.2 - alle optional. numeric-Spalten kommen als String aus TypeORM
  // (Praezision), gleiches Muster wie z.B. Lagerbewegung.menge.
  @Column({ name: 'gewicht_kg', type: 'numeric', precision: 10, scale: 3, nullable: true })
  gewichtKg: string | null;

  @Column({ name: 'laenge_mm', type: 'numeric', precision: 10, scale: 2, nullable: true })
  laengeMm: string | null;

  @Column({ name: 'breite_mm', type: 'numeric', precision: 10, scale: 2, nullable: true })
  breiteMm: string | null;

  @Column({ name: 'hoehe_mm', type: 'numeric', precision: 10, scale: 2, nullable: true })
  hoeheMm: string | null;

  // Nur relevant wenn bestandsgefuehrt=true (feldkatalog.md) - anders als
  // bestandsgefuehrt/bomfaehig selbst KEIN Service-seitig erzwungenes Feld,
  // sondern eine reine Zusatzinfo (Frontend blendet es nur passend ein/aus).
  @Column({ name: 'mindestbestand', type: 'numeric', precision: 14, scale: 3, nullable: true })
  mindestbestand: string | null;

  // Rein internes Notizfeld (z.B. Einkaufskonditionen-Hinweise, Lagerplatz-
  // Besonderheiten) - erscheint NIE auf Belegen, im Unterschied zu
  // 'beschreibung' (Langtext, kann auf Angeboten/Rechnungen landen). Bewusst
  // einsprachig: interne Notizen sind fuers eigene Team, keine Uebersetzung
  // noetig (anders als bezeichnung/beschreibung, siehe ArtikelUebersetzung).
  @Column({ name: 'interne_notiz', type: 'text', nullable: true })
  interneNotiz: string | null;

  @Column({ name: 'custom_fields', type: 'jsonb', nullable: true })
  customFields: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
