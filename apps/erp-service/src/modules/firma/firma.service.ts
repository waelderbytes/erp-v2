import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Firma } from '../../database/entities/firma.entity';
import { Artikel } from '../../database/entities/artikel.entity';
import { FirmaAktualisierenDto } from './dto/firma-aktualisieren.dto';

// Firma ist Singleton (id=1), siehe firma.entity.ts.
@Injectable()
export class FirmaService {
  constructor(
    @InjectRepository(Firma) private readonly firmaRepo: Repository<Firma>,
    @InjectRepository(Artikel) private readonly artikelRepo: Repository<Artikel>,
  ) {}

  async getOrCreate(): Promise<Firma> {
    let firma = await this.firmaRepo.findOneBy({ id: 1 });
    if (!firma) {
      firma = await this.firmaRepo.save(this.firmaRepo.create({ id: 1 }));
    }
    return firma;
  }

  // Sperr-Logik aus docs/architecture.md Abschnitt 6 ("Artikelnummern-Schema"):
  // sobald mindestens 1 Artikel existiert, ist das Schema nicht mehr aenderbar -
  // hart im Service durchgesetzt, nicht nur im UI ausgegraut.
  async setArtikelnummernSchema(schema: 'einfach' | 'kategorie'): Promise<Firma> {
    const anzahlArtikel = await this.artikelRepo.count();
    if (anzahlArtikel > 0) {
      throw new ConflictException(
        'Artikelnummern-Schema kann nicht mehr geaendert werden - es existiert bereits mindestens ein Artikel.',
      );
    }
    const firma = await this.getOrCreate();
    firma.artikelnummernSchema = schema;
    return this.firmaRepo.save(firma);
  }

  async setArtikelnummernStellen(stellen: number): Promise<Firma> {
    // Stellenanzahl bleibt AUCH nach dem ersten Artikel aenderbar (betrifft nur
    // Formatierung kuenftiger Nummern), siehe architecture.md Abschnitt 6.
    const firma = await this.getOrCreate();
    firma.artikelnummernStellen = Math.max(1, Math.min(stellen, 15));
    return this.firmaRepo.save(firma);
  }
  // Firmenstammdaten (Migration 0016). PATCH-Semantik wie ueberall sonst im
  // Projekt - nur mitgeschickte Felder werden geaendert.
  async aktualisieren(dto: FirmaAktualisierenDto): Promise<Firma> {
    const firma = await this.getOrCreate();
    if (dto.name !== undefined) firma.name = dto.name;
    if (dto.strasse !== undefined) firma.strasse = dto.strasse;
    if (dto.plz !== undefined) firma.plz = dto.plz;
    if (dto.ort !== undefined) firma.ort = dto.ort;
    if (dto.land !== undefined) firma.land = dto.land;
    if (dto.ustIdNr !== undefined) firma.ustIdNr = dto.ustIdNr;
    if (dto.steuernummer !== undefined) firma.steuernummer = dto.steuernummer;
    if (dto.telefon !== undefined) firma.telefon = dto.telefon;
    if (dto.email !== undefined) firma.email = dto.email;
    if (dto.kleinunternehmer !== undefined) firma.kleinunternehmer = dto.kleinunternehmer;
    return this.firmaRepo.save(firma);
  }
}
