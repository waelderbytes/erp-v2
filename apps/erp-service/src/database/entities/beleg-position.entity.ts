// Positionszeile eines Belegs (siehe beleg.entity.ts). Artikel-Stammdaten werden
// bei Anlage/Uebernahme "eingefroren" (Bezeichnung/Einheit/Preis/Steuersatz als
// Snapshot) - spaetere Preis-/Steuersatzaenderungen am Artikel duerfen bereits
// erstellte Belege nicht rueckwirkend veraendern (GoBD-Gedanke).
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Beleg } from './beleg.entity';
import { Artikel } from './artikel.entity';
import { Steuersatz } from './steuersatz.entity';

@Entity('beleg_position')
export class BelegPosition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'beleg_id' })
  belegId: string;

  @ManyToOne(() => Beleg, (b) => b.positionen, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'beleg_id' })
  beleg: Beleg;

  @Column({ name: 'position_nr' })
  positionNr: number;

  // SET NULL statt RESTRICT: ein spaeter geloeschter Artikel darf das Loeschen
  // nicht blockieren - die Snapshot-Felder (bezeichnung etc.) bleiben trotzdem
  // gueltig, artikelId dient nur noch der Rueckverfolgbarkeit.
  @Column({ name: 'artikel_id', nullable: true })
  artikelId: string | null;

  @ManyToOne(() => Artikel, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'artikel_id' })
  artikel?: Artikel;

  @Column()
  bezeichnung: string;

  @Column({ type: 'numeric', precision: 14, scale: 3 })
  menge: string;

  // Analog bestellposition.gelieferte_menge (siehe bestellposition.entity.ts):
  // wird AUSSCHLIESSLICH durch beleg.service.ts::uebernehmen() fortgeschrieben,
  // nie direkt vom Client gesetzt - Grundlage fuer echte Teillieferung/
  // -rechnung (Nutzerentscheidung 08.08.2026, anders als v1).
  @Column({ name: 'weitergefuehrte_menge', type: 'numeric', precision: 14, scale: 3, default: 0 })
  weitergefuehrteMenge: string;

  @Column({ name: 'einheit_code', nullable: true })
  einheitCode: string | null;

  @Column({ name: 'einzelpreis', type: 'numeric', precision: 12, scale: 2 })
  einzelpreis: string;

  // Referenz bleibt erhalten (Nachvollziehbarkeit), der eigentliche
  // Steuerbetrag wird aber immer aus dem Snapshot steuersatzProzent berechnet -
  // damit bleibt der Beleg auch dann korrekt, wenn der Steuersatz spaeter
  // geaendert oder deaktiviert wird.
  @Column({ name: 'steuersatz_id', nullable: true })
  steuersatzId: string | null;

  @ManyToOne(() => Steuersatz, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'steuersatz_id' })
  steuersatz?: Steuersatz;

  @Column({ name: 'steuersatz_prozent', type: 'numeric', precision: 5, scale: 2 })
  steuersatzProzent: string;

  // Vorgaengerposition, aus der diese (Teil-)Menge per "Uebernehmen" erzeugt
  // wurde. Mehrere Nachfolgepositionen koennen auf dieselbe Vorgaengerposition
  // zeigen (mehrere Teillieferungen/-rechnungen aus einer Auftragsposition).
  @Column({ name: 'referenz_position_id', type: 'uuid', nullable: true })
  referenzPositionId: string | null;

  @ManyToOne(() => BelegPosition, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'referenz_position_id' })
  referenzPosition?: BelegPosition;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
