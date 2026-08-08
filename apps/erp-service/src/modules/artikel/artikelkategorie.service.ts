// Verwaltung der Artikel-Haupt-/Untergruppen (Nummernschema 'kategorie'),
// siehe artikelkategorie.entity.ts und artikel-nummer.service.ts. Bisher
// existierten nur die Entitaeten + die Nummernvergabe selbst - dieser
// Service ergaenzt das fehlende CRUD, damit das Schema ueberhaupt nutzbar
// wird (Nutzerforderung 08.08.2026, Kundendemo).
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Artikel } from '../../database/entities/artikel.entity';
import { Artikelkategorie, ArtikelkategorieTyp } from '../../database/entities/artikelkategorie.entity';
import { ArtikelNummerService } from './artikel-nummer.service';
import { ArtikelkategorieAnlegenDto } from './dto/artikelkategorie-anlegen.dto';
import { ArtikelkategorieAktualisierenDto } from './dto/artikelkategorie-aktualisieren.dto';

@Injectable()
export class ArtikelkategorieService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly artikelNummerService: ArtikelNummerService,
  ) {}

  // typ optional filterbar (Frontend laedt Haupt-/Untergruppen meist getrennt
  // fuer die zwei Spalten der Verwaltungs-UI).
  liste(typ?: string): Promise<Artikelkategorie[]> {
    if (typ && typ !== 'haupt' && typ !== 'unter') {
      throw new BadRequestException(`Unbekannter Kategorietyp '${typ}'. Erlaubt: haupt, unter.`);
    }
    return this.dataSource.getRepository(Artikelkategorie).find({
      where: typ ? { typ: typ as ArtikelkategorieTyp } : {},
      order: { name: 'ASC' },
    });
  }

  async anlegen(dto: ArtikelkategorieAnlegenDto): Promise<Artikelkategorie> {
    const repo = this.dataSource.getRepository(Artikelkategorie);
    const kategorie = repo.create({
      typ: dto.typ,
      name: dto.name,
      code: dto.code ? dto.code.toUpperCase() : null,
      aktiv: true,
    });
    return repo.save(kategorie);
  }

  async aktualisieren(id: string, dto: ArtikelkategorieAktualisierenDto): Promise<Artikelkategorie> {
    const repo = this.dataSource.getRepository(Artikelkategorie);
    const kategorie = await repo.findOneBy({ id });
    if (!kategorie) {
      throw new NotFoundException('Kategorie nicht gefunden.');
    }
    if (dto.name !== undefined) kategorie.name = dto.name;
    if (dto.code !== undefined) kategorie.code = dto.code ? dto.code.toUpperCase() : null;
    if (dto.aktiv !== undefined) kategorie.aktiv = dto.aktiv;
    return repo.save(kategorie);
  }

  // Live-Vorschau der naechsten Artikelnummer fuer eine Haupt-/Untergruppen-
  // Kombination (Formular "Artikel anlegen") - liest nur, reserviert NICHT
  // (das passiert erst beim tatsaechlichen Anlegen in artikel.service.ts).
  vorschauNummer(hauptgruppeId: string, untergruppeId: string): Promise<string> {
    return this.artikelNummerService.previewNummer(hauptgruppeId, untergruppeId);
  }

  // Fuer die UI-Warnung "wird bereits von N Artikeln verwendet" beim
  // Deaktivieren einer Kategorie - rein informativ, blockiert nichts.
  async zaehleArtikel(id: string): Promise<number> {
    return this.dataSource.getRepository(Artikel).count({ where: [{ hauptgruppeId: id }, { untergruppeId: id }] });
  }
}
