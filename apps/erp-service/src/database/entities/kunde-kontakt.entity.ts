// Ansprechpartner je Kunde, siehe docs/feldkatalog.md Abschnitt 2.3.
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Kunde } from './kunde.entity';

@Entity('kunde_kontakt')
export class KundeKontakt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'kunde_id' })
  kundeId: string;

  @ManyToOne(() => Kunde, (k) => k.kontakte, { onDelete: 'CASCADE' })
  kunde: Kunde;

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
