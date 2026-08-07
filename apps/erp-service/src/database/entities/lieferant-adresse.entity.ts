import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Lieferant } from './lieferant.entity';

export type LieferantAdresseTyp = 'rechnung' | 'versand_von' | 'werk' | 'sonstige';

@Entity('lieferant_adresse')
export class LieferantAdresse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'lieferant_id' })
  lieferantId: string;

  @ManyToOne(() => Lieferant, (l) => l.adressen, { onDelete: 'CASCADE' })
  lieferant: Lieferant;

  @Column({ type: 'varchar' })
  typ: LieferantAdresseTyp;

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
