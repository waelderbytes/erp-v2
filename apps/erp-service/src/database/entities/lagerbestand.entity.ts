// Aktueller Bestand je Artikel+Lager - siehe docs/module-uebersicht.md
// "Lagerverwaltung". Wird NIE direkt vom Client geschrieben, sondern ausschliesslich
// durch lagerbewegung.service.ts ueber gebuchte Bewegungen fortgeschrieben
// (Bewegungs-Ledger als Quelle der Wahrheit, Bestand ist die daraus abgeleitete
// aktuelle Summe - analog zum Nummernkreis-Row-Lock-Muster, siehe
// docs/architecture.md Abschnitt 6).
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Artikel } from './artikel.entity';
import { Lager } from './lager.entity';

@Entity('lagerbestand')
export class Lagerbestand {
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

  @Column({ type: 'numeric', precision: 14, scale: 3, default: 0 })
  menge: string;
}
