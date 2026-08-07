import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Einheit } from '../../database/entities/einheit.entity';
import { EinheitAnlegenDto } from './dto/einheit-anlegen.dto';

@Injectable()
export class EinheitService {
  constructor(@InjectRepository(Einheit) private readonly einheitRepo: Repository<Einheit>) {}

  // Liefert ALLE Einheiten (auch deaktivierte) - das Dropdown im Frontend
  // filtert selbst (deaktivierte nur zeigen, wenn sie am gerade bearbeiteten
  // Artikel noch zugewiesen sind, siehe SearchCreateDropdown-Kommentar in
  // ArtikelDetail.tsx, 1:1 uebernommenes Muster aus v1).
  liste(): Promise<Einheit[]> {
    return this.einheitRepo.find({ order: { code: 'ASC' } });
  }

  async anlegen(dto: EinheitAnlegenDto): Promise<Einheit> {
    const einheit = this.einheitRepo.create({
      code: dto.code,
      name: dto.name,
      dezimalstellen: dto.dezimalstellen ?? 2,
    });
    try {
      return await this.einheitRepo.save(einheit);
    } catch (e) {
      // Postgres-Fehlercode 23505 = unique_violation (siehe Migration
      // 0009_einheiten.ts, UNIQUE auf code) - durchgaengiges Pattern im
      // Projekt, klare fachliche Fehlermeldung statt rohem 500er.
      if ((e as { code?: string }).code === '23505') {
        throw new ConflictException(`Eine Einheit mit dem Code '${dto.code}' existiert bereits.`);
      }
      throw e;
    }
  }

  // Soft-Delete (wie in ERP v1): Einheit verschwindet nur aus der aktiven
  // Auswahl, bestehende Artikel-Zuordnungen bleiben unveraendert bestehen.
  async deaktivieren(id: string): Promise<void> {
    const einheit = await this.einheitRepo.findOneBy({ id });
    if (!einheit) {
      throw new NotFoundException('Einheit nicht gefunden.');
    }
    einheit.aktiv = false;
    await this.einheitRepo.save(einheit);
  }
}
