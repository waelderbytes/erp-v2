// modul_key + aktion, siehe docs/rbac-rollenkatalog.md Abschnitt 1.
import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

export type BerechtigungsAktion = 'lesen' | 'schreiben' | 'loeschen' | 'administrieren';

@Entity('berechtigung')
@Unique(['modulKey', 'aktion'])
export class Berechtigung {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'modul_key' })
  modulKey: string;

  @Column({ type: 'varchar' })
  aktion: BerechtigungsAktion;
}
