// Bestellung an einen Lieferanten (Kopf) - siehe docs/module-uebersicht.md
// "Einkauf/Bestellwesen". Status-Workflow bewusst einfach gehalten (MVP): kein
// Genehmigungsprozess, keine Budgetpruefung - das ist fuer spaetere Ausbaustufen.
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Lieferant } from './lieferant.entity';
import { Bestellposition } from './bestellposition.entity';

export type BestellungStatus = 'offen' | 'bestellt' | 'teilweise_geliefert' | 'abgeschlossen' | 'storniert';

@Entity('bestellung')
export class Bestellung {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'bestellnummer', unique: true })
  bestellnummer: string;

  @Column({ name: 'lieferant_id' })
  lieferantId: string;

  @ManyToOne(() => Lieferant)
  @JoinColumn({ name: 'lieferant_id' })
  lieferant: Lieferant;

  @Column({ type: 'varchar', length: 30, default: 'offen' })
  status: BestellungStatus;

  @Column({ name: 'bestelldatum', type: 'date', default: () => 'CURRENT_DATE' })
  bestelldatum: string;

  @Column({ name: 'erwartetes_lieferdatum', type: 'date', nullable: true })
  erwartetesLieferdatum: string | null;

  @Column({ type: 'text', nullable: true })
  kommentar: string | null;

  @OneToMany(() => Bestellposition, (p) => p.bestellung, { cascade: true })
  positionen: Bestellposition[];

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'now()' })
  updatedAt: Date;
}
