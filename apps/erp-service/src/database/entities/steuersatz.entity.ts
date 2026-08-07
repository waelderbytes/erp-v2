// Steuersatz-Stammdaten, Teil des Moduls Stammdaten/System-Einstellungen
// (Nutzerentscheidung: erstmal 1 Firma, siehe session-handoff.md). Loest
// den bisherigen String-Platzhalter artikel.steuersatz_id ab (siehe
// artikel.entity.ts) - feldkatalog.md Abschnitt 1.1 verlangt eine echte FK.
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('steuersatz')
export class Steuersatz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bezeichnung: string;

  // numeric kommt als string aus TypeORM (Praezision), gleiches Muster wie
  // ueberall sonst im Projekt (z.B. artikelpreis.betrag).
  @Column({ type: 'numeric', precision: 5, scale: 2 })
  satz: string;

  @Column({ default: true })
  aktiv: boolean;

  // Genau 1 Steuersatz sollte ist_standard=true haben (Service-seitig
  // durchgesetzt, siehe steuersatz.service.ts) - wird als Vorauswahl beim
  // Artikel-Anlegen verwendet und als Backfill-Ziel in Migration 0015.
  @Column({ name: 'ist_standard', default: false })
  istStandard: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
