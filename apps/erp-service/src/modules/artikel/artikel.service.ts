import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artikel } from '../../database/entities/artikel.entity';
import { ArtikelLieferant } from '../../database/entities/artikel-lieferant.entity';
import { FirmaService } from '../firma/firma.service';
import { ArtikelNummerService, KategorieOhneCodeError } from './artikel-nummer.service';
import { ArtikelAnlegenDto } from './dto/artikel-anlegen.dto';
import { ArtikelLieferantZuordnenDto } from './dto/artikel-lieferant-zuordnen.dto';

@Injectable()
export class ArtikelService {
  constructor(
    @InjectRepository(Artikel) private readonly artikelRepo: Repository<Artikel>,
    @InjectRepository(ArtikelLieferant) private readonly artikelLieferantRepo: Repository<ArtikelLieferant>,
    private readonly firmaService: FirmaService,
    private readonly artikelNummerService: ArtikelNummerService,
  ) {}

  async anlegen(dto: ArtikelAnlegenDto): Promise<Artikel> {
    const firma = await this.firmaService.getOrCreate();

    let artikelnummer: string;
    if (firma.artikelnummernSchema === 'kategorie' && dto.hauptgruppeId && dto.untergruppeId) {
      try {
        artikelnummer = await this.artikelNummerService.reserviereNummer(dto.hauptgruppeId, dto.untergruppeId);
      } catch (e) {
        if (e instanceof KategorieOhneCodeError) {
          // Fallback wie in ERP v1: ohne Code an der Kategorie greift das einfache
          // Schema, statt das Anlegen hart zu blockieren.
          artikelnummer = await this.artikelNummerService.reserviereEinfacheNummer();
        } else {
          throw e;
        }
      }
    } else {
      artikelnummer = await this.artikelNummerService.reserviereEinfacheNummer();
    }

    const artikel = this.artikelRepo.create({
      artikelnummer,
      artikelart: dto.artikelart,
      bezeichnung: dto.bezeichnung,
      beschreibung: dto.beschreibung ?? null,
      hauptgruppeId: dto.hauptgruppeId ?? null,
      untergruppeId: dto.untergruppeId ?? null,
      bestandsgefuehrt: dto.artikelart !== 'dienstleistung' && (dto.bestandsgefuehrt ?? false),
    });
    return this.artikelRepo.save(artikel);
  }

  liste(): Promise<Artikel[]> {
    return this.artikelRepo.find({ order: { artikelnummer: 'ASC' } });
  }

  find(id: string): Promise<Artikel | null> {
    return this.artikelRepo.findOneBy({ id });
  }

  // Legt die n:m-Zuordnung Artikel<->Lieferant an. Vorher gibt es keine Zeile,
  // die per favoritSetzen() favorisiert werden koennte - siehe Kommentar im DTO.
  async lieferantZuordnen(artikelId: string, dto: ArtikelLieferantZuordnenDto): Promise<ArtikelLieferant> {
    const zuordnung = this.artikelLieferantRepo.create({
      artikelId,
      lieferantId: dto.lieferantId,
      lieferantenArtikelnummer: dto.lieferantenArtikelnummer ?? null,
      einkaufspreis: dto.einkaufspreis ?? null,
      lieferzeitTage: dto.lieferzeitTage ?? null,
    });
    try {
      return await this.artikelLieferantRepo.save(zuordnung);
    } catch (e) {
      // Postgres-Fehlercode 23505 = unique_violation (siehe Migration
      // 0003_artikel_lieferant_unique.ts). Klare fachliche Fehlermeldung statt
      // eines rohen 500ers mit DB-Interna.
      if ((e as { code?: string }).code === '23505') {
        throw new ConflictException('Dieser Lieferant ist diesem Artikel bereits zugeordnet.');
      }
      throw e;
    }
  }

  lieferantenListe(artikelId: string): Promise<ArtikelLieferant[]> {
    return this.artikelLieferantRepo.find({
      where: { artikelId },
      relations: ['lieferant'],
    });
  }

  // Favoriten-Logik aus docs/feldkatalog.md Abschnitt 1.4: hoechstens ein
  // bevorzugter Lieferant je Artikel - Umschalten setzt den vorherigen automatisch
  // zurueck (Transaktion, kein manuelles Nachziehen im Frontend noetig).
  async lieferantAlsFavoritSetzen(artikelId: string, lieferantZuordnungId: string): Promise<void> {
    await this.artikelLieferantRepo.manager.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .update(ArtikelLieferant)
        .set({ istBevorzugt: false })
        .where('artikel_id = :artikelId', { artikelId })
        .execute();

      await manager
        .createQueryBuilder()
        .update(ArtikelLieferant)
        .set({ istBevorzugt: true })
        .where('id = :id AND artikel_id = :artikelId', { id: lieferantZuordnungId, artikelId })
        .execute();
    });
  }
}
