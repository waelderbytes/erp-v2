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

  // Kiosk-Login (Wandtablet ohne vollen ERP-Zugang, siehe kiosk-auth.service.ts)
  // - alle drei bewusst nullable, nur Mitarbeiter mit Kiosk-Zugriff bekommen das
  // ueberhaupt gesetzt. personalnummer/rfidUid global eindeutig durchgesetzt per
  // partiellem Unique-Index (Migration 0002), NULL bleibt erlaubt.
  @Column({ nullable: true })
  personalnummer: string | null;

  // argon2id-Hash wie passwortHash, aber eigenes Feld - Passwort und PIN sind
  // unabhaengig voneinander (siehe Migrationskommentar).
  @Column({ name: 'pin_hash', nullable: true })
  pinHash: string | null;

  // RFID-Kartenleser-Anbindung vorbereitet, Hardware-Integration folgt spaeter
  // (siehe Migrationskommentar).
  @Column({ name: 'rfid_uid', nullable: true })
  rfidUid: string | null;

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
