// Lagerort (Warenlager) - siehe docs/module-uebersicht.md "Lagerverwaltung".
// Bewusst minimal fuer den MVP: kein Lagerplatz/Regal-Feingranularitaet, nur
// Lager-Ebene. Feingranularitaet (Lagerplaetze) ist bei Bedarf spaeter ergaenzbar,
// ohne das bestehende Schema umzubauen (lagerbestand/-bewegung referenzieren
// bereits per FK, nicht per Freitext).
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('lager')
export class Lager {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bezeichnung: string;

  // Genau ein Standardlager pro Tenant vorgesehen (fuer Wareneingang ohne explizite
  // Lagerauswahl) - Durchsetzung ("nur eins darf Standard sein") folgt wie beim
  // Artikel-Lieferant-Favoriten ueber einen partiellen Unique-Index, siehe Migration.
  @Column({ name: 'ist_standard', default: false })
  istStandard: boolean;

  @Column({ default: true })
  aktiv: boolean;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;
}
