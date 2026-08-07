// Mehrsprachigkeit fuer Kurztext(bezeichnung)/Langtext(beschreibung), siehe
// Migration 0008. 'de' bleibt bewusst direkt auf artikel.bezeichnung/
// beschreibung - hier nur ZUSAETZLICHE Sprachen (Muster aus ERP v1
// uebernommen, siehe Migrationskommentar).
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Artikel } from './artikel.entity';

@Entity('artikel_uebersetzung')
@Unique(['artikelId', 'sprache'])
export class ArtikelUebersetzung {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'artikel_id' })
  @Index()
  artikelId: string;

  @ManyToOne(() => Artikel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'artikel_id' })
  artikel: Artikel;

  @Column({ type: 'varchar', length: 5 })
  sprache: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  kurztext: string | null;

  @Column({ type: 'text', nullable: true })
  langtext: string | null;
}
