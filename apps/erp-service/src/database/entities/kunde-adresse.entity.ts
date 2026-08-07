// Mehrere Adressen je Kunde, siehe docs/feldkatalog.md Abschnitt 2.2.
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Kunde } from './kunde.entity';

export type KundeAdresseTyp = 'rechnung' | 'lieferung' | 'baustelle' | 'sonstige';

@Entity('kunde_adresse')
export class KundeAdresse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'kunde_id' })
  kundeId: string;

  @ManyToOne(() => Kunde, (k) => k.adressen, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'kunde_id' })
  kunde: Kunde;

  @Column({ type: 'varchar' })
  typ: KundeAdresseTyp;

  @Column({ name: 'ist_standard', default: false })
  istStandard: boolean;

  @Column()
  strasse: string;

  @Column()
  plz: string;

  @Column()
  ort: string;

  @Column({ default: 'DE' })
  land: string;

  @Column({ nullable: true })
  zusatz: string | null;
}
