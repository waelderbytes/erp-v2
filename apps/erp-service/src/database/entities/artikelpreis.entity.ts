// Preisfindung MVP - siehe docs/module-uebersicht.md "Preisfindung". Deckt
// Staffelpreise (staffelAbMenge), kundenspezifische Preise (kundeId), und
// zeitlich begrenzte Aktionspreise (gueltigVon/gueltigBis) mit EINER Tabelle ab,
// statt getrennter Spezialtabellen - Ermittlungslogik siehe
// preisfindung.service.ts.
//
// WICHTIG: preisNetto ist immer NETTO (ohne USt). Die Brutto-Anzeige bzw. die
// Entscheidung "USt ausweisen oder nicht" (Kleinunternehmer nach §19 UStG vs.
// Regelbesteuerer, siehe docs/module-uebersicht.md Cross-Cutting Concerns) ist
// bewusst NICHT Teil dieses Moduls, sondern Aufgabe der spaeteren Belegkette
// (Angebot/Auftrag/Rechnung) - dort ist der tatsaechliche Steuerstatus des
// Kunden/der Firma relevant, nicht bei der reinen Preisermittlung.
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Artikel } from './artikel.entity';
import { Kunde } from './kunde.entity';

@Entity('artikelpreis')
export class Artikelpreis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'artikel_id' })
  artikelId: string;

  @ManyToOne(() => Artikel)
  @JoinColumn({ name: 'artikel_id' })
  artikel: Artikel;

  // null = allgemeiner Preis (fuer alle Kunden), gesetzt = kundenspezifischer
  // Preis - gewinnt in der Ermittlung immer vor einem allgemeinen Preis.
  @Column({ name: 'kunde_id', nullable: true })
  kundeId: string | null;

  @ManyToOne(() => Kunde)
  @JoinColumn({ name: 'kunde_id' })
  kunde: Kunde | null;

  @Column({ name: 'staffel_ab_menge', type: 'numeric', precision: 14, scale: 3, default: 0 })
  staffelAbMenge: string;

  @Column({ name: 'preis_netto', type: 'numeric', precision: 12, scale: 2 })
  preisNetto: string;

  @Column({ name: 'gueltig_von', type: 'date', nullable: true })
  gueltigVon: string | null;

  @Column({ name: 'gueltig_bis', type: 'date', nullable: true })
  gueltigBis: string | null;

  // Expliziter Tie-Breaker fuer die Ermittlung: z. B. eine kurzfristige Aktion mit
  // gleicher Staffelstufe wie ein bestehender Preis soll trotzdem gewinnen -
  // dafuer eine hoehere prioritaet vergeben statt die Staffel-Logik zu verbiegen.
  @Column({ default: 0 })
  prioritaet: number;

  @Column({ default: true })
  aktiv: boolean;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;
}
