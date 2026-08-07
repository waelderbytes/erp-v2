// Bestellposition - siehe docs/module-uebersicht.md "Einkauf/Bestellwesen".
// gelieferteMenge wird ausschliesslich durch das Buchen eines Wareneingangs auf
// diese Position fortgeschrieben (einkauf.service.ts), nie direkt vom Client
// gesetzt - Quelle der Wahrheit ist wie bei Lagerbestand das Bewegungs-Ledger.
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Bestellung } from './bestellung.entity';
import { Artikel } from './artikel.entity';

@Entity('bestellposition')
export class Bestellposition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'bestellung_id' })
  bestellungId: string;

  @ManyToOne(() => Bestellung, (b) => b.positionen, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bestellung_id' })
  bestellung: Bestellung;

  @Column({ name: 'artikel_id' })
  artikelId: string;

  @ManyToOne(() => Artikel)
  @JoinColumn({ name: 'artikel_id' })
  artikel: Artikel;

  @Column({ type: 'numeric', precision: 14, scale: 3 })
  menge: string;

  @Column({ name: 'gelieferte_menge', type: 'numeric', precision: 14, scale: 3, default: 0 })
  gelieferteMenge: string;

  @Column({ name: 'einzelpreis', type: 'numeric', precision: 12, scale: 2, nullable: true })
  einzelpreis: string | null;
}
