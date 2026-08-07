import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { KioskGeraet } from '../../database/entities/kiosk-geraet.entity';
import { PasswortService } from '../auth/passwort.service';
import { KioskGeraetAnlegenDto } from './dto/kiosk-geraet-anlegen.dto';

@Injectable()
export class KioskGeraetService {
  constructor(
    @InjectRepository(KioskGeraet) private readonly geraetRepo: Repository<KioskGeraet>,
    private readonly passwortService: PasswortService,
  ) {}

  // Der Klartext-API-Key wird NUR hier, einmalig bei der Anlage, zurueckgegeben -
  // genau wie ein Passwort wird ausschliesslich der Hash dauerhaft gespeichert.
  // Wer den Key verliert, muss ein neues Geraet anlegen (kein "Key anzeigen"
  // nachtraeglich moeglich - by design).
  async anlegen(dto: KioskGeraetAnlegenDto): Promise<{ id: string; bezeichnung: string; apiKey: string }> {
    const apiKey = randomBytes(24).toString('base64url');
    const geraet = this.geraetRepo.create({
      bezeichnung: dto.bezeichnung,
      apiKeyHash: await this.passwortService.hash(apiKey),
    });
    const gespeichert = await this.geraetRepo.save(geraet);
    return { id: gespeichert.id, bezeichnung: gespeichert.bezeichnung, apiKey };
  }

  liste(): Promise<Pick<KioskGeraet, 'id' | 'bezeichnung' | 'aktiv' | 'createdAt'>[]> {
    return this.geraetRepo.find({ select: ['id', 'bezeichnung', 'aktiv', 'createdAt'] });
  }

  // Prueft den vom Tablet gesendeten Klartext-API-Key gegen ALLE aktiven Geraete
  // (kein direkter Hash-Lookup moeglich, da argon2-Hashes nicht deterministisch
  // sind) - bei der ueblichen Groessenordnung von wenigen Kiosk-Tablets pro
  // Tenant performant genug, kein Kandidat fuer Premature Optimization.
  async geraetGueltig(apiKey: string): Promise<boolean> {
    const aktiveGeraete = await this.geraetRepo.find({ where: { aktiv: true } });
    for (const geraet of aktiveGeraete) {
      if (await this.passwortService.verify(geraet.apiKeyHash, apiKey)) {
        return true;
      }
    }
    return false;
  }
}
