import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lieferant } from '../../database/entities/lieferant.entity';
import { NummernkreisService } from '../nummernkreis/nummernkreis.service';
import { LieferantAnlegenDto } from './dto/lieferant-anlegen.dto';

@Injectable()
export class LieferantService {
  constructor(
    @InjectRepository(Lieferant) private readonly lieferantRepo: Repository<Lieferant>,
    private readonly nummernkreisService: NummernkreisService,
  ) {}

  async anlegen(dto: LieferantAnlegenDto): Promise<Lieferant> {
    const lieferantennummer = await this.nummernkreisService.issueNextNumber('lieferanten');
    const lieferant = this.lieferantRepo.create({
      lieferantennummer,
      firmenname: dto.firmenname,
      ustIdnr: dto.ustIdnr ?? null,
      iban: dto.iban ?? null,
      adressen: (dto.adressen ?? []).map((a) => ({ ...a, istStandard: a.istStandard ?? false })),
      kontakte: (dto.kontakte ?? []).map((k) => ({ ...k, istHauptkontakt: k.istHauptkontakt ?? false })),
    });
    return this.lieferantRepo.save(lieferant);
  }

  liste(): Promise<Lieferant[]> {
    return this.lieferantRepo.find({ order: { lieferantennummer: 'ASC' } });
  }

  find(id: string): Promise<Lieferant | null> {
    return this.lieferantRepo.findOne({ where: { id }, relations: ['adressen', 'kontakte'] });
  }
}
