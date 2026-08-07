import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kunde } from '../../database/entities/kunde.entity';
import { KundeBewertung } from '../../database/entities/kunde-bewertung.entity';
import { NummernkreisService } from '../nummernkreis/nummernkreis.service';
import { KundeAnlegenDto } from './dto/kunde-anlegen.dto';
import { KundeBewertenDto } from './dto/kunde-bewerten.dto';

@Injectable()
export class KundeService {
  constructor(
    @InjectRepository(Kunde) private readonly kundeRepo: Repository<Kunde>,
    @InjectRepository(KundeBewertung) private readonly bewertungRepo: Repository<KundeBewertung>,
    private readonly nummernkreisService: NummernkreisService,
  ) {}

  async anlegen(dto: KundeAnlegenDto): Promise<Kunde> {
    const kundennummer = await this.nummernkreisService.issueNextNumber('kunden');
    const kunde = this.kundeRepo.create({
      kundennummer,
      typ: dto.typ,
      firmenname: dto.firmenname ?? null,
      vorname: dto.vorname ?? null,
      nachname: dto.nachname ?? null,
      ustIdnr: dto.ustIdnr ?? null,
      sprache: dto.sprache ?? 'de',
      adressen: (dto.adressen ?? []).map((a) => ({ ...a, istStandard: a.istStandard ?? false })),
      kontakte: (dto.kontakte ?? []).map((k) => ({ ...k, istHauptkontakt: k.istHauptkontakt ?? false })),
    });
    return this.kundeRepo.save(kunde);
  }

  liste(): Promise<Kunde[]> {
    return this.kundeRepo.find({ order: { kundennummer: 'ASC' } });
  }

  find(id: string): Promise<Kunde | null> {
    return this.kundeRepo.findOne({ where: { id }, relations: ['adressen', 'kontakte'] });
  }

  // "bewertetVon" kommt bewusst NICHT aus dem DTO, sondern vom authentifizierten
  // Benutzer (siehe kunde.controller.ts) - sonst koennte man Bewertungen im Namen
  // anderer Benutzer abgeben.
  async bewerten(kundeId: string, dto: KundeBewertenDto, bewertetVon: string): Promise<KundeBewertung> {
    // Ein aktueller Wert je Kunde+Kriterium, siehe docs/feldkatalog.md Abschnitt 2.5 -
    // vorhandene Bewertung fuer dieselbe Kombination wird ersetzt (Historie laeuft
    // ueber das generische Audit-Log, keine eigene Historientabelle noetig).
    let bewertung = await this.bewertungRepo.findOneBy({ kundeId, kriteriumId: dto.kriteriumId });
    if (!bewertung) {
      bewertung = this.bewertungRepo.create({ kundeId, kriteriumId: dto.kriteriumId });
    }
    bewertung.sterne = dto.sterne;
    bewertung.kommentar = dto.kommentar ?? null;
    bewertung.bewertetVon = bewertetVon;
    bewertung.bewertetAm = new Date();
    return this.bewertungRepo.save(bewertung);
  }

  bewertungen(kundeId: string): Promise<KundeBewertung[]> {
    return this.bewertungRepo.find({ where: { kundeId }, relations: ['kriterium'] });
  }
}
