import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artikelpreis } from '../../database/entities/artikelpreis.entity';
import { PreisAnlegenDto } from './dto/preis-anlegen.dto';
import { PreisErmittelnQueryDto } from './dto/preis-ermitteln-query.dto';

// Ermittlungslogik siehe Entity-Kommentar (artikelpreis.entity.ts) fuer den
// fachlichen Hintergrund. Kurzfassung: kundenspezifische Preise schlagen
// allgemeine, danach entscheidet zuerst prioritaet, dann die hoechste noch
// zutreffende Staffelstufe.
@Injectable()
export class PreisfindungService {
  constructor(@InjectRepository(Artikelpreis) private readonly preisRepo: Repository<Artikelpreis>) {}

  anlegen(dto: PreisAnlegenDto): Promise<Artikelpreis> {
    const preis = this.preisRepo.create({
      artikelId: dto.artikelId,
      kundeId: dto.kundeId ?? null,
      staffelAbMenge: dto.staffelAbMenge ?? '0',
      preisNetto: dto.preisNetto,
      gueltigVon: dto.gueltigVon ?? null,
      gueltigBis: dto.gueltigBis ?? null,
      prioritaet: dto.prioritaet ?? 0,
    });
    return this.preisRepo.save(preis);
  }

  listeJeArtikel(artikelId: string): Promise<Artikelpreis[]> {
    return this.preisRepo.find({ where: { artikelId }, order: { staffelAbMenge: 'ASC' } });
  }

  async ermitteln(query: PreisErmittelnQueryDto): Promise<{ preisNetto: string; quelle: Artikelpreis }> {
    const menge = Number(query.menge ?? '1');
    const datum = query.datum ?? new Date().toISOString().slice(0, 10);

    const kandidaten = await this.preisRepo
      .createQueryBuilder('p')
      .where('p.artikel_id = :artikelId', { artikelId: query.artikelId })
      .andWhere('p.aktiv = true')
      .andWhere('(p.gueltig_von IS NULL OR p.gueltig_von <= :datum)', { datum })
      .andWhere('(p.gueltig_bis IS NULL OR p.gueltig_bis >= :datum)', { datum })
      .andWhere('p.staffel_ab_menge <= :menge', { menge })
      .getMany();

    if (kandidaten.length === 0) {
      throw new NotFoundException('Kein gueltiger Preis fuer diesen Artikel (und ggf. Menge/Datum) hinterlegt.');
    }

    // Gruppe waehlen: kundenspezifisch bevorzugt, aber nur wenn fuer DIESEN Kunden
    // tatsaechlich etwas hinterlegt ist - sonst Fallback auf die allgemeinen Preise.
    const kundenspezifisch = query.kundeId ? kandidaten.filter((p) => p.kundeId === query.kundeId) : [];
    const gruppe = kundenspezifisch.length > 0 ? kundenspezifisch : kandidaten.filter((p) => p.kundeId === null);

    if (gruppe.length === 0) {
      throw new NotFoundException('Kein gueltiger Preis fuer diesen Artikel (und ggf. Menge/Datum) hinterlegt.');
    }

    const gewinner = gruppe.sort((a, b) => {
      if (a.prioritaet !== b.prioritaet) return b.prioritaet - a.prioritaet;
      return Number(b.staffelAbMenge) - Number(a.staffelAbMenge);
    })[0];

    return { preisNetto: gewinner.preisNetto, quelle: gewinner };
  }
}
