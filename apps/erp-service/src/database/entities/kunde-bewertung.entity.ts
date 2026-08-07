// Sterne-Bewertung je Kriterium, siehe docs/feldkatalog.md Abschnitt 2.5.
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Kunde } from './kunde.entity';
import { Bewertungskriterium } from './bewertungskriterium.entity';

@Entity('kunde_bewertung')
export class KundeBewertung {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'kunde_id' })
  kundeId: string;

  @ManyToOne(() => Kunde, { onDelete: 'CASCADE' })
  kunde: Kunde;

  @Column({ name: 'kriterium_id' })
  kriteriumId: string;

  @ManyToOne(() => Bewertungskriterium)
  kriterium: Bewertungskriterium;

  @Column({ type: 'smallint' })
  sterne: number;

  @Column({ type: 'text', nullable: true })
  kommentar: string | null;

  @Column({ name: 'bewertet_von' })
  bewertetVon: string;

  @Column({ name: 'bewertet_am', type: 'timestamptz', default: () => 'now()' })
  bewertetAm: Date;
}
