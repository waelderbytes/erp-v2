// n:m Artikel<->Lieferant mit Favoriten-Kennzeichen, siehe docs/feldkatalog.md
// Abschnitt 1.4. lieferant_id ist seit der Kunden-/Lieferantenstamm-Migration ein
// echter FK auf lieferant(id) (siehe Migration 0002_kunden_lieferantenstamm).
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Artikel } from './artikel.entity';
import { Lieferant } from './lieferant.entity';

@Entity('artikel_lieferant')
export class ArtikelLieferant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'artikel_id' })
  artikelId: string;

  // Explizites @JoinColumn zwingend noetig: ohne das legt TypeORM zusaetzlich zur
  // hier deklarierten Spalte 'artikel_id' eine eigene, implizite Join-Spalte an
  // (Default-Namensschema: Relationsname + 'Id' = 'artikelId', camelCase statt
  // snake_case) - die es in der DB nicht gibt. Fuehrte zu
  // "column \"artikelId\" of relation \"artikel_lieferant\" does not exist" (08.08.2026).
  @ManyToOne(() => Artikel)
  @JoinColumn({ name: 'artikel_id' })
  artikel: Artikel;

  @Column({ name: 'lieferant_id' })
  lieferantId: string;

  @ManyToOne(() => Lieferant)
  @JoinColumn({ name: 'lieferant_id' })
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
