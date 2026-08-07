// Stueckliste (BOM), mehrstufig: eine Position verknuepft einen Kopf-Artikel
// mit einem Positions-Artikel, der SELBST wieder ein Fertigungsartikel mit
// eigener Stueckliste sein kann (kopf_artikel_id/position_artikel_id zeigen
// beide auf artikel.id) - daraus ergibt sich die Baumstruktur. Siehe
// stueckliste.service.ts fuer Zirkelbezug-Schutz (Migration erzwingt nur den
// trivialen Fall kopf<>position direkt selbst, nicht indirekte Zyklen -
// das kann eine CHECK-Constraint nicht rekursiv pruefen).
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Artikel } from './artikel.entity';

@Entity('stueckliste_position')
export class StuecklistePosition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'kopf_artikel_id' })
  kopfArtikelId: string;

  @ManyToOne(() => Artikel)
  @JoinColumn({ name: 'kopf_artikel_id' })
  kopfArtikel: Artikel;

  @Column({ name: 'position_artikel_id' })
  positionArtikelId: string;

  @ManyToOne(() => Artikel)
  @JoinColumn({ name: 'position_artikel_id' })
  positionArtikel: Artikel;

  // Feste Menge (Nutzerentscheidung: kein Verschnitt-/Ausschuss-Aufschlag-Feld
  // vorerst) - bezogen auf 1 Einheit des Kopf-Artikels.
  @Column({ type: 'numeric', precision: 14, scale: 3 })
  menge: string;

  @Column({ default: 0 })
  sortierung: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
