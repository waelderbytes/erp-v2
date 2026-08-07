import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Lieferant } from './lieferant.entity';

@Entity('lieferant_kontakt')
export class LieferantKontakt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'lieferant_id' })
  lieferantId: string;

  @ManyToOne(() => Lieferant, (l) => l.kontakte, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lieferant_id' })
  lieferant: Lieferant;

  @Column()
  vorname: string;

  @Column()
  nachname: string;

  @Column({ nullable: true })
  funktion: string | null;

  @Column({ nullable: true })
  telefon: string | null;

  @Column({ nullable: true })
  email: string | null;

  @Column({ name: 'ist_hauptkontakt', default: false })
  istHauptkontakt: boolean;
}
