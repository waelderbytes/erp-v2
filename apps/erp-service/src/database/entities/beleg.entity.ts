// Verkaufs-Belegkette: Angebot -> Auftragsbestaetigung -> Lieferschein -> Rechnung
// (siehe docs/module-uebersicht.md "Belegkette (Verkauf)"). EIN gemeinsames
// Beleg+BelegPosition-Datenmodell fuer alle vier Typen statt vier eigener
// Tabellen - Vorbild fuers reine Feldschema war das eigene ERP v1
// (waelderbytes-suite), der Ablauf/die Umwandlungs- und Teillieferungslogik
// ist aber bewusst NEU entworfen (Nutzerentscheidung 08.08.2026: "wir sollten
// uns nicht zu nah am v1 orientieren ... nicht fuer Ablaeufe" - v1 hatte z.B.
// gar keine echte Teillieferung/-rechnung, nur 1:1-Vollkopie beim Umwandeln).
//
// 'proforma'/'abschlag' seit 08.08.2026 (Nutzerforderung, Kundendemo) als
// ZUSATZBELEGE ergaenzt: entstehen ausschliesslich aus einer Auftrags-
// bestaetigung (siehe beleg.service.ts::zusatzbeleg()), sind aber bewusst
// NICHT Teil von BELEG_KETTE/der normalen uebernehmen()-Logik - sie sind
// unverbindliche/ergaenzende Kopien und beeinflussen weder
// weitergefuehrteMenge noch den Status des Quellbelegs (anders als
// Lieferschein/Rechnung). Feldschema-Idee (nicht Ablauf!) an v1s
// zusatz_nachfolger angelehnt, siehe Kommentar in beleg.service.ts.
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Kunde } from './kunde.entity';
import { BelegPosition } from './beleg-position.entity';

export type BelegTyp = 'angebot' | 'auftragsbestaetigung' | 'lieferschein' | 'rechnung' | 'proforma' | 'abschlag';

// Generischer Lebenszyklus-Status, analog dem bereits etablierten Muster bei
// Bestellung (siehe bestellung.entity.ts): 'weitergefuehrt' ist hier der
// typneutrale Oberbegriff fuer "hat einen Nachfolgebeleg bekommen" (bei
// Auftragsbestaetigung z.B. durch einen Lieferschein, bei Lieferschein durch
// eine Rechnung). Rechnung hat keinen Nachfolger, bleibt bis zur Stornierung
// im Status 'offen' - GoBD-Unveraenderlichkeit laeuft separat ueber das Feld
// festgeschrieben, nicht ueber den Status.
export type BelegStatus = 'offen' | 'teilweise_weitergefuehrt' | 'abgeschlossen' | 'storniert';

@Entity('beleg')
export class Beleg {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'beleg_typ', type: 'varchar', length: 30 })
  belegTyp: BelegTyp;

  @Column({ name: 'belegnummer', unique: true })
  belegnummer: string;

  @Column({ name: 'kunde_id' })
  kundeId: string;

  @ManyToOne(() => Kunde)
  @JoinColumn({ name: 'kunde_id' })
  kunde: Kunde;

  @Column({ type: 'varchar', length: 30, default: 'offen' })
  status: BelegStatus;

  @Column({ name: 'belegdatum', type: 'date', default: () => 'CURRENT_DATE' })
  belegdatum: string;

  // Vorgaenger in der Umwandlungskette (z.B. Lieferschein.referenzBelegId zeigt
  // auf die Auftragsbestaetigung, aus der er per "Uebernehmen" erzeugt wurde).
  // Kein Zwang - jeder Belegtyp kann auch frei ohne Vorgaenger angelegt werden.
  @Column({ name: 'referenz_beleg_id', type: 'uuid', nullable: true })
  referenzBelegId: string | null;

  @ManyToOne(() => Beleg, { nullable: true })
  @JoinColumn({ name: 'referenz_beleg_id' })
  referenzBeleg?: Beleg;

  // GoBD-Unveraenderlichkeit (siehe architecture.md Abschnitt 5/Verfahrens-
  // dokumentation): nur fuer Rechnungen relevant, nach dem Festschreiben sind
  // Positionen nicht mehr aenderbar. Wird im ersten Wurf (noch ohne PDF-Ausgabe)
  // ueber einen expliziten Endpoint gesetzt, spaeter automatisch beim ersten
  // PDF-Abruf (analog v1s Ansatz, dort aber nur fuer RECHNUNGSARTIGE_TYPEN).
  @Column({ default: false })
  festgeschrieben: boolean;

  @Column({ type: 'text', nullable: true })
  kommentar: string | null;

  @OneToMany(() => BelegPosition, (p) => p.beleg, { cascade: true })
  positionen: BelegPosition[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
