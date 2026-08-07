// Siehe docs/rbac-rollenkatalog.md Abschnitt 1/2.
import { Column, Entity, ManyToMany, JoinTable, PrimaryGeneratedColumn } from 'typeorm';
import { Berechtigung } from './berechtigung.entity';

@Entity('rolle')
export class Rolle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ name: 'ist_system_rolle', default: false })
  istSystemRolle: boolean;

  @Column({ nullable: true })
  beschreibung: string | null;

  @ManyToMany(() => Berechtigung)
  @JoinTable({
    name: 'rolle_berechtigung',
    joinColumn: { name: 'rolle_id' },
    inverseJoinColumn: { name: 'berechtigung_id' },
  })
  berechtigungen: Berechtigung[];
}
