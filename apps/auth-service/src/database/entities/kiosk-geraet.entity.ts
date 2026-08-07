// Kiosk-Geraet (Wandtablet in der Halle) - authentifiziert sich mit einem
// eigenen API-Key (siehe kiosk-auth.service.ts) als Basisschutz gegen PIN-
// Brute-Force. Gehoert der Tenant-Installation, nicht einer Person - deshalb
// keine Relation zu Benutzer.
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('kiosk_geraet')
export class KioskGeraet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bezeichnung: string;

  // argon2id-Hash des API-Keys - der Klartext-Key wird nur einmal beim Anlegen
  // angezeigt (siehe kiosk-geraet.service.ts), genau wie ein Passwort.
  @Column({ name: 'api_key_hash' })
  apiKeyHash: string;

  @Column({ default: true })
  aktiv: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
