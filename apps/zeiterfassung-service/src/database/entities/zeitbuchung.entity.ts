// Unveraenderliches Buchungs-Ledger (Kommt/Geht/Pause) - siehe
// docs/module-uebersicht.md "Zeiterfassung". Analog zum Lagerbewegungs-Ledger in
// erp-service: die Buchungszeilen sind die Quelle der Wahrheit, Arbeitszeit/
// Pausenzeit werden daraus abgeleitet (zeiterfassung.service.ts), nicht separat
// gespeichert - kein Update/Delete vorgesehen (Korrekturen kommen spaeter als
// eigene, nachvollziehbare Korrekturbuchung, nicht als Aenderung bestehender
// Zeilen - GoBD-Prinzip wie beim Rest des Systems).
//
// benutzer_id ist bewusst NUR eine Spalte mit DB-FK (REFERENCES benutzer(id)),
// OHNE TypeORM-Relation-Objekt: benutzer gehoert zu auth-service, nicht zu
// diesem Service - beide Services teilen sich zwar dieselbe physische Tenant-DB
// (siehe docs/architecture.md), aber jeder Service kennt in seinem eigenen
// TypeORM-Entity-Set nur seine eigenen Tabellen. Der DB-FK funktioniert trotzdem
// (gleiche physische DB), nur eben ohne komfortables ORM-Object-Loading -
// Mitarbeiter-Namen fuer Anzeigezwecke muessten ueber einen Aufruf an
// auth-service oder eine spaetere lokale Kopie/Cache-Tabelle kommen (noch nicht
// gebaut, siehe README "Bekannte Einschraenkungen").
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type ZeitbuchungTyp = 'kommt' | 'geht' | 'pause_beginn' | 'pause_ende';
export type ZeitbuchungQuelle = 'web' | 'kiosk';

@Entity('zeitbuchung')
export class Zeitbuchung {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'benutzer_id' })
  benutzerId: string;

  @Column({ type: 'varchar', length: 20 })
  typ: ZeitbuchungTyp;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  zeitpunkt: Date;

  // Vorbereitet fuer die spaetere Projekt-/Auftragsverwaltung (existiert noch
  // nicht, siehe docs/module-uebersicht.md) - bewusst OHNE FK-Constraint, da die
  // Zieltabelle noch nicht existiert. Analog zum bomfaehig-Flag bei Artikel:
  // Datenmodell ist vorbereitet, Funktionalitaet kommt spaeter.
  @Column({ name: 'auftrag_id', type: 'uuid', nullable: true })
  auftragId: string | null;

  // GPS-Erfassung BEIM BUCHEN (kein permanentes Tracking) - siehe
  // docs/module-uebersicht.md. Nur relevant fuer 'web'-Quelle (PWA auf eigenem
  // Geraet); Kiosk-Buchungen haben eine implizit bekannte, feste Position (das
  // Tablet haengt fest in der Halle) und setzen das nicht.
  @Column({ name: 'standort_lat', type: 'numeric', precision: 9, scale: 6, nullable: true })
  standortLat: string | null;

  @Column({ name: 'standort_lng', type: 'numeric', precision: 9, scale: 6, nullable: true })
  standortLng: string | null;

  @Column({ type: 'varchar', length: 10 })
  quelle: ZeitbuchungQuelle;

  @Column({ type: 'text', nullable: true })
  kommentar: string | null;
}
