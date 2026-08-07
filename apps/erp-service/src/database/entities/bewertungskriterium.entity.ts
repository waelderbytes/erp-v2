// Tenant-konfigurierbarer Kriterien-Katalog, siehe docs/feldkatalog.md Abschnitt 2.5.
// entity_type schon jetzt generisch (nicht nur 'kunde'), damit spaeter auch
// Lieferantenbewertung ohne Schema-Aenderung moeglich ist.
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('bewertungskriterium')
export class Bewertungskriterium {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entity_type', type: 'varchar' })
  entityType: 'kunde' | 'lieferant';

  @Column()
  bezeichnung: string;

  @Column({ default: true })
  aktiv: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;
}
