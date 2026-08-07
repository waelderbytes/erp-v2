import { Column, CreateDateColumn, Entity, ManyToMany, JoinTable, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Rolle } from './rolle.entity';

@Entity('benutzer')
export class Benutzer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  // argon2-Hash, siehe modules/auth/passwort.service.ts - nie Klartext.
  @Column({ name: 'passwort_hash' })
  passwortHash: string;

  @Column({ name: 'vorname', nullable: true })
  vorname: string | null;

  @Column({ name: 'nachname', nullable: true })
  nachname: string | null;

  @Column({ default: true })
  aktiv: boolean;

  @ManyToMany(() => Rolle)
  @JoinTable({
    name: 'benutzer_rolle',
    joinColumn: { name: 'benutzer_id' },
    inverseJoinColumn: { name: 'rolle_id' },
  })
  rollen: Rolle[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
