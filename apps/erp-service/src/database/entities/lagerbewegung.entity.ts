// Unveraenderliches Bewegungs-Ledger (Wareneingang/-ausgang/Umbuchung/Inventur-
// korrektur) - siehe docs/module-uebersicht.md "Lagerverwaltung". menge ist immer
// das VORZEICHENBEHAFTETE Delta (Wareneingang positiv, Warenausgang negativ), damit
// der aktuelle Bestand durch simples Aufsummieren nachvollziehbar bleibt (Audit-
// Trail durch Konstruktion, kein separater audit_log-Trigger noetig, da hier nie
// UPDATE/DELETE stattfindet - nur INSERT).
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Artikel } from './artikel.entity';
import { Lager } from './lager.entity';

export type LagerbewegungTyp = 'wareneingang' | 'warenausgang' | 'umbuchung' | 'inventur_korrektur';

@Entity('lagerbewegung')
export class Lagerbewegung {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'artikel_id' })
  artikelId: string;

  @ManyToOne(() => Artikel)
  @JoinColumn({ name: 'artikel_id' })
  artikel: Artikel;

  @Column({ name: 'lager_id' })
  lagerId: string;

  @ManyToOne(() => Lager)
  @JoinColumn({ name: 'lager_id' })
  lager: Lager;

  @Column({ type: 'varchar', length: 30 })
  typ: LagerbewegungTyp;

  @Column({ type: 'numeric', precision: 14, scale: 3 })
  menge: string;

  // Verknuepft die beiden Gegenbuchungen einer Umbuchung (Abgang am Quelllager +
  // Zugang am Ziellager) - fachlich eine Aktion, technisch zwei Bewegungszeilen.
  @Column({ name: 'umbuchung_gruppe_id', type: 'uuid', nullable: true })
  umbuchungGruppeId: string | null;

  @Column({ type: 'text', nullable: true })
  kommentar: string | null;

  @Column({ name: 'gebucht_von' })
  gebuchtVon: string;

  @Column({ name: 'gebucht_am', type: 'timestamptz', default: () => 'now()' })
  gebuchtAm: Date;
}
