import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lager } from '../../database/entities/lager.entity';
import { Lagerbestand } from '../../database/entities/lagerbestand.entity';
import { LagerAnlegenDto } from './dto/lager-anlegen.dto';

@Injectable()
export class LagerService {
  constructor(
    @InjectRepository(Lager) private readonly lagerRepo: Repository<Lager>,
    @InjectRepository(Lagerbestand) private readonly lagerbestandRepo: Repository<Lagerbestand>,
  ) {}

  async anlegen(dto: LagerAnlegenDto): Promise<Lager> {
    return this.lagerRepo.manager.transaction(async (manager) => {
      if (dto.istStandard) {
        // Analog zur Favoriten-Logik bei Artikel-Lieferant: vorheriges
        // Standardlager automatisch zuruecksetzen, sonst verletzt der partielle
        // Unique-Index (lager_ein_standard) beim Insert.
        await manager.createQueryBuilder().update(Lager).set({ istStandard: false }).where('ist_standard = true').execute();
      }
      const lager = manager.create(Lager, {
        bezeichnung: dto.bezeichnung,
        istStandard: dto.istStandard ?? false,
      });
      return manager.save(lager);
    });
  }

  liste(): Promise<Lager[]> {
    return this.lagerRepo.find({ order: { bezeichnung: 'ASC' } });
  }

  bestandJeLager(lagerId: string): Promise<Lagerbestand[]> {
    return this.lagerbestandRepo.find({ where: { lagerId }, relations: ['artikel'] });
  }

  bestandJeArtikel(artikelId: string): Promise<Lagerbestand[]> {
    return this.lagerbestandRepo.find({ where: { artikelId }, relations: ['lager'] });
  }
}
