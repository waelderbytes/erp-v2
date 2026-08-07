// Kernfelder gemaess docs/feldkatalog.md Abschnitt 2.1. waehrung/sprache als
// einfache String-Spalten (kein eigenes Lookup-Modul noetig fuer den Start).
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { KundeAdresse } from './kunde-adresse.entity';
import { KundeKontakt } from './kunde-kontakt.entity';

export type KundeTyp = 'firma' | 'privatperson';

@Entity('kunde')
export class Kunde {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'kundennummer', unique: true })
  kundennummer: string;

  @Column({ type: 'varchar' })
  typ: KundeTyp;

  @Column({ name: 'firmenname', nullable: true })
  firmenname: string | null;

  @Column({ nullable: true })
  vorname: string | null;

  @Column({ nullable: true })
  nachname: string | null;

  @Column({ name: 'ust_idnr', nullable: true })
  ustIdnr: string | null;

  @Column({ name: 'steuernummer', nullable: true })
  steuernummer: string | null;

  @Column({ default: 'EUR' })
  waehrung: string;

  @Column({ name: 'zahlungsziel_tage', nullable: true })
  zahlungszielTage: number | null;

  @Column({ default: 'de' })
  sprache: string;

  @Column({ default: true })
  aktiv: boolean;

  @Column({ name: 'custom_fields', type: 'jsonb', nullable: true })
  customFields: Record<string, unknown> | null;

  @OneToMany(() => KundeAdresse, (a) => a.kunde)
  adressen: KundeAdresse[];

  @OneToMany(() => KundeKontakt, (k) => k.kunde)
  kontakte: KundeKontakt[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
