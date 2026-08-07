// Generische Nummernkreis-Engine, siehe docs/architecture.md Abschnitt 6.
// entity_key z.B. "artikel", "kunden", "lieferanten" - fuer Belegtypen spaeter erweitert.
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('nummernkreis')
export class Nummernkreis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entity_key', unique: true })
  entityKey: string;

  @Column()
  label: string;

  @Column({ default: '' })
  prefix: string;

  @Column({ name: 'start_value', default: 1 })
  startValue: number;

  @Column({ name: 'next_value', default: 1 })
  nextValue: number;

  @Column({ default: 5 })
  stellen: number;
}
