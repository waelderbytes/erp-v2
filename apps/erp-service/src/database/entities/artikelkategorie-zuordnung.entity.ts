// Zaehler PRO KOMBINATION Haupt-/Untergruppe, nicht global je Untergruppe - siehe
// docs/architecture.md Abschnitt 6 ("Kategoriebasierte Artikelnummern"). Wird bei
// Bedarf automatisch angelegt (siehe artikel-nummer.service.ts).
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Artikelkategorie } from './artikelkategorie.entity';

@Entity('artikelkategorie_zuordnung')
@Unique(['oberId', 'unterId'])
export class ArtikelkategorieZuordnung {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ober_id' })
  oberId: string;

  @ManyToOne(() => Artikelkategorie)
  ober: Artikelkategorie;

  @Column({ name: 'unter_id' })
  unterId: string;

  @ManyToOne(() => Artikelkategorie)
  unter: Artikelkategorie;

  @Column({ name: 'naechste_nummer', default: 1 })
  naechsteNummer: number;
}
