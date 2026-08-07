import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Artikelkategorie } from '../../database/entities/artikelkategorie.entity';
import { ArtikelkategorieZuordnung } from '../../database/entities/artikelkategorie-zuordnung.entity';
import { Firma } from '../../database/entities/firma.entity';
import { NummernkreisService } from '../nummernkreis/nummernkreis.service';

// Fehlt Ober- oder Unterkategorie ein Code, kann keine sprechende Nummer gebildet
// werden - Aufrufer (ArtikelService) entscheidet, wie damit umgegangen wird.
export class KategorieOhneCodeError extends Error {}

// Kategoriebasierte Artikelnummern (Schema XXX-YYY-lfd), siehe docs/architecture.md
// Abschnitt 6: Zaehler haengt an der KOMBINATION Haupt-/Untergruppe, nicht an der
// Untergruppe allein. Reservierung laeuft - wie beim generischen Nummernkreis - unter
// Row-Lock (SELECT ... FOR UPDATE), damit zwei gleichzeitige Anlagen nicht dieselbe
// Nummer bekommen.
@Injectable()
export class ArtikelNummerService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly nummernkreisService: NummernkreisService,
  ) {}

  private formatiere(codes: string[], laufnummer: number, stellen: number): string {
    return `${codes.join('-')}-${String(laufnummer).padStart(stellen, '0')}`;
  }

  private async ladeKategorienUndCodes(
    hauptgruppeId: string,
    untergruppeId: string,
  ): Promise<{ ober: Artikelkategorie; unter: Artikelkategorie; codes: string[] }> {
    const repo = this.dataSource.getRepository(Artikelkategorie);
    const ober = await repo.findOneByOrFail({ id: hauptgruppeId });
    const unter = await repo.findOneByOrFail({ id: untergruppeId });
    if (!ober.code || !unter.code) {
      throw new KategorieOhneCodeError(`Warengruppe '${!ober.code ? ober.name : unter.name}' hat keinen Code.`);
    }
    return { ober, unter, codes: [ober.code, unter.code] };
  }

  async previewNummer(hauptgruppeId: string, untergruppeId: string): Promise<string> {
    const { codes } = await this.ladeKategorienUndCodes(hauptgruppeId, untergruppeId);
    const firma = await this.dataSource.getRepository(Firma).findOneBy({ id: 1 });
    const stellen = firma?.artikelnummernStellen ?? 5;

    const zuordnung = await this.dataSource.getRepository(ArtikelkategorieZuordnung).findOneBy({
      oberId: hauptgruppeId,
      unterId: untergruppeId,
    });
    const naechsteNummer = zuordnung?.naechsteNummer ?? 1;
    return this.formatiere(codes, naechsteNummer, stellen);
  }

  async reserviereNummer(hauptgruppeId: string, untergruppeId: string): Promise<string> {
    const { codes } = await this.ladeKategorienUndCodes(hauptgruppeId, untergruppeId);
    const firma = await this.dataSource.getRepository(Firma).findOneBy({ id: 1 });
    const stellen = firma?.artikelnummernStellen ?? 5;

    return this.dataSource.transaction(async (manager) => {
      let zuordnung = await manager
        .createQueryBuilder(ArtikelkategorieZuordnung, 'z')
        .setLock('pessimistic_write')
        .where('z.ober_id = :hauptgruppeId AND z.unter_id = :untergruppeId', {
          hauptgruppeId,
          untergruppeId,
        })
        .getOne();

      if (!zuordnung) {
        zuordnung = manager.create(ArtikelkategorieZuordnung, {
          oberId: hauptgruppeId,
          unterId: untergruppeId,
          naechsteNummer: 1,
        });
        await manager.save(zuordnung);
        // Nach dem Insert erneut sperren, damit ein paralleler zweiter Aufruf hier
        // ebenfalls blockiert statt eine zweite Zeile anzulegen (UNIQUE(ober,unter)
        // faengt den Extremfall zusaetzlich als letzte Verteidigungslinie ab).
        zuordnung = await manager
          .createQueryBuilder(ArtikelkategorieZuordnung, 'z')
          .setLock('pessimistic_write')
          .where('z.id = :id', { id: zuordnung.id })
          .getOneOrFail();
      }

      const nummer = this.formatiere(codes, zuordnung.naechsteNummer, stellen);
      zuordnung.naechsteNummer += 1;
      await manager.save(zuordnung);
      return nummer;
    });
  }

  // Fuer Schema "einfach" - reine Delegation an den generischen Nummernkreis.
  async reserviereEinfacheNummer(): Promise<string> {
    return this.nummernkreisService.issueNextNumber('artikel');
  }
}
