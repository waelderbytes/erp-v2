// Kernfelder gemaess docs/feldkatalog.md Abschnitt 3.1.
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { LieferantAdresse } from './lieferant-adresse.entity';
import { LieferantKontakt } from './lieferant-kontakt.entity';

@Entity('lieferant')
export class Lieferant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'lieferantennummer', unique: true })
  lieferantennummer: string;

  @Column({ name: 'firmenname' })
  firmenname: string;

  @Column({ name: 'ust_idnr', nullable: true })
  ustIdnr: string | null;

  @Column({ name: 'steuernummer', nullable: true })
  steuernummer: string | null;

  @Column({ default: 'EUR' })
  waehrung: string;

  @Column({ name: 'zahlungsziel_tage', nullable: true })
  zahlungszielTage: number | null;

  @Column({ nullable: true })
  iban: string | null;

  @Column({ nullable: true })
  bic: string | null;

  @Column({ name: 'mindestbestellwert', type: 'numeric', precision: 12, scale: 2, nullable: true })
  mindestbestellwert: string | null;

  @Column({ name: 'lieferzeit_tage', nullable: true })
  lieferzeitTage: number | null;

  @Column({ default: 'de' })
  sprache: string;

  @Column({ default: true })
  aktiv: boolean;

  @Column({ name: 'custom_fields', type: 'jsonb', nullable: true })
  customFields: Record<string, unknown> | null;

  @OneToMany(() => LieferantAdresse, (a) => a.lieferant)
  adressen: LieferantAdresse[];

  @OneToMany(() => LieferantKontakt, (k) => k.lieferant)
  kontakte: LieferantKontakt[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
