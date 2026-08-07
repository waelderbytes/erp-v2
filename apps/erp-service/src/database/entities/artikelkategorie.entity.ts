// Haupt-/Untergruppe fuer Artikel, siehe docs/feldkatalog.md Abschnitt 1.1 und
// docs/architecture.md Abschnitt 6 (kategoriebasierte Artikelnummern).
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type ArtikelkategorieTyp = 'haupt' | 'unter';

@Entity('artikelkategorie')
export class Artikelkategorie {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  typ: ArtikelkategorieTyp;

  @Column()
  name: string;

  // Code fuer sprechende Artikelnummer (z.B. "BAU", "ELE") - nur bei
  // artikelnummern_schema == 'kategorie' zwingend erforderlich, siehe
  // KategorieOhneCodeError in artikel-nummer.service.ts.
  @Column({ nullable: true })
  code: string | null;

  @Column({ default: true })
  aktiv: boolean;
}
