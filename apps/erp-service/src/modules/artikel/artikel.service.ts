import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artikel } from '../../database/entities/artikel.entity';
import { ArtikelUebersetzung } from '../../database/entities/artikel-uebersetzung.entity';
import { ArtikelLieferant } from '../../database/entities/artikel-lieferant.entity';
import { FirmaService } from '../firma/firma.service';
import { ArtikelNummerService, KategorieOhneCodeError } from './artikel-nummer.service';
import { ArtikelAnlegenDto } from './dto/artikel-anlegen.dto';
import { ArtikelLieferantZuordnenDto } from './dto/artikel-lieferant-zuordnen.dto';
import { ArtikelAktualisierenDto } from './dto/artikel-aktualisieren.dto';
import { ArtikelUebersetzungUpsertDto } from './dto/artikel-uebersetzung-upsert.dto';

@Injectable()
export class ArtikelService {
  constructor(
    @InjectRepository(Artikel) private readonly artikelRepo: Repository<Artikel>,
    @InjectRepository(ArtikelLieferant) private readonly artikelLieferantRepo: Repository<ArtikelLieferant>,
    @InjectRepository(ArtikelUebersetzung) private readonly artikelUebersetzungRepo: Repository<ArtikelUebersetzung>,
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
      einheitId: dto.einheitId ?? null,
      eanGtin: dto.eanGtin ?? null,
      hersteller: dto.hersteller ?? null,
      herstellerArtikelnummer: dto.herstellerArtikelnummer ?? null,
      interneNotiz: dto.interneNotiz ?? null,
    });
    try {
      return await this.artikelRepo.save(artikel);
    } catch (e) {
      // Postgres-Fehlercode 23505 = unique_violation (siehe Migration
      // 0007_artikel_hersteller_artikelnummer.ts, partieller Unique-Index auf
      // hersteller_artikelnummer). Klare fachliche Fehlermeldung statt eines
      // rohen 500ers mit DB-Interna.
      if ((e as { code?: string }).code === '23505') {
        throw new ConflictException(
          `Ein Artikel mit der Herstellerartikelnummer '${dto.herstellerArtikelnummer}' existiert bereits.`,
        );
      }
      throw e;
    }
  }

  liste(): Promise<Artikel[]> {
    return this.artikelRepo.find({ order: { artikelnummer: 'ASC' }, relations: ['einheit'] });
  }

  find(id: string): Promise<Artikel | null> {
    return this.artikelRepo.findOne({ where: { id }, relations: ['einheit'] });
  }

  async aktualisieren(id: string, dto: ArtikelAktualisierenDto): Promise<Artikel> {
    const artikel = await this.artikelRepo.findOneBy({ id });
    if (!artikel) {
      throw new NotFoundException('Artikel nicht gefunden.');
    }
    if (dto.bezeichnung !== undefined) artikel.bezeichnung = dto.bezeichnung;
    if (dto.beschreibung !== undefined) artikel.beschreibung = dto.beschreibung;
    if (dto.einheitId !== undefined) artikel.einheitId = dto.einheitId;
    if (dto.eanGtin !== undefined) artikel.eanGtin = dto.eanGtin;
    if (dto.hersteller !== undefined) artikel.hersteller = dto.hersteller;
    if (dto.herstellerArtikelnummer !== undefined) artikel.herstellerArtikelnummer = dto.herstellerArtikelnummer;
    if (dto.interneNotiz !== undefined) artikel.interneNotiz = dto.interneNotiz;
    // Wie beim Anlegen: Dienstleistungen sind nie bestandsgefuehrt, unabhaengig
    // davon, was uebergeben wird - siehe gleiche Logik in anlegen().
    if (dto.bestandsgefuehrt !== undefined) {
      artikel.bestandsgefuehrt = artikel.artikelart !== 'dienstleistung' && dto.bestandsgefuehrt;
    }
    if (dto.aktiv !== undefined) artikel.aktiv = dto.aktiv;

    try {
      return await this.artikelRepo.save(artikel);
    } catch (e) {
      if ((e as { code?: string }).code === '23505') {
        throw new ConflictException(
          `Ein Artikel mit der Herstellerartikelnummer '${dto.herstellerArtikelnummer}' existiert bereits.`,
        );
      }
      throw e;
    }
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

  // --- Mehrsprachigkeit (Kurztext/Langtext je Zusatzsprache) -----------------
  // 'de' wird hier bewusst NICHT angeboten - das sind bezeichnung/beschreibung
  // direkt auf dem Artikel (siehe artikel.entity.ts, Migration 0008).

  uebersetzungenListe(artikelId: string): Promise<ArtikelUebersetzung[]> {
    return this.artikelUebersetzungRepo.find({ where: { artikelId }, order: { sprache: 'ASC' } });
  }

  // PUT-Upsert keyed auf (artikelId, sprache) - kein Uebersetzungs-Id-Konzept im
  // Frontend noetig, gleiches Muster wie in ERP v1 (waelderbytes-suite).
  async uebersetzungUpsert(
    artikelId: string,
    sprache: string,
    dto: ArtikelUebersetzungUpsertDto,
  ): Promise<ArtikelUebersetzung> {
    if (sprache.toLowerCase() === 'de') {
      throw new ConflictException(
        "Sprache 'de' wird nicht als Uebersetzung gepflegt - dafuer bezeichnung/beschreibung direkt am Artikel verwenden.",
      );
    }
    let uebersetzung = await this.artikelUebersetzungRepo.findOneBy({ artikelId, sprache });
    if (!uebersetzung) {
      uebersetzung = this.artikelUebersetzungRepo.create({ artikelId, sprache });
    }
    if (dto.kurztext !== undefined) uebersetzung.kurztext = dto.kurztext;
    if (dto.langtext !== undefined) uebersetzung.langtext = dto.langtext;
    return this.artikelUebersetzungRepo.save(uebersetzung);
  }

  async uebersetzungLoeschen(artikelId: string, sprache: string): Promise<void> {
    const ergebnis = await this.artikelUebersetzungRepo.delete({ artikelId, sprache });
    if (ergebnis.affected === 0) {
      throw new NotFoundException(`Keine Uebersetzung fuer Sprache '${sprache}' vorhanden.`);
    }
  }
}
