// Einheiten-Stammdaten (Code/Name/Dezimalstellen), Vorbild ERP v1
// (waelderbytes-suite, modules/stammdaten/models.py::Einheit). Zieht einen
// Teil des noch offenen Moduls "Stammdaten/System-Einstellungen" vor
// (Nutzerentscheidung 08.08.2026: echtes Einheiten-Modul statt statischer
// Liste im Frontend) - das Artikel-Wizard-Einheit-Dropdown braucht eine
// konsistente, erweiterbare Liste statt Freitext.
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('einheit')
export class Einheit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ default: true })
  aktiv: boolean;

  // Steuert Rundung/Schrittweite im Mengenfeld ueberall wo diese Einheit
  // verwendet wird (Beleg-Positionen, Lagerbuchungen - beides noch nicht
  // gebaut, Feld aber schon vorgesehen wie in v1). Default 2, "Stueck" wird
  // beim Seed einmalig manuell auf 0 gesetzt - keine verlaessliche Ableitung
  // aus Name/Code moeglich.
  @Column({ name: 'dezimalstellen', default: 2 })
  dezimalstellen: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
