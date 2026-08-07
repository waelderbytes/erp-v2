// n:m Artikel<->Lieferant mit Favoriten-Kennzeichen, siehe docs/feldkatalog.md
// Abschnitt 1.4. lieferant_id ist seit der Kunden-/Lieferantenstamm-Migration ein
// echter FK auf lieferant(id) (siehe Migration 0002_kunden_lieferantenstamm).
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Artikel } from './artikel.entity';
import { Lieferant } from './lieferant.entity';

@Entity('artikel_lieferant')
export class ArtikelLieferant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'artikel_id' })
  artikelId: string;

  @ManyToOne(() => Artikel)
  artikel: Artikel;

  @Column({ name: 'lieferant_id' })
  lieferantId: string;

  @ManyToOne(() => Lieferant)
  lieferant: Lieferant;

  @Column({ name: 'lieferanten_artikelnummer', nullable: true })
  lieferantenArtikelnummer: string | null;

  @Column({ name: 'einkaufspreis', type: 'numeric', precision: 12, scale: 2, nullable: true })
  einkaufspreis: string | null;

  @Column({ name: 'lieferzeit_tage', nullable: true })
  lieferzeitTage: number | null;

  @Column({ name: 'ist_bevorzugt', default: false })
  istBevorzugt: boolean;
}
