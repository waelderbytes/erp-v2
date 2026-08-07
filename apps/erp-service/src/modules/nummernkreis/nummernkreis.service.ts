import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Nummernkreis } from '../../database/entities/nummernkreis.entity';
import { NUMMERNKREIS_DEFAULT_LABELS } from './nummernkreis.entity-labels';
import { NummernkreisAktualisierenDto } from './dto/nummernkreis-aktualisieren.dto';

// Siehe docs/architecture.md Abschnitt 6 fuer die volle Begruendung. Kernpunkte:
// - SELECT ... FOR UPDATE als Row-Lock statt Advisory-Lock/optimistischem Retry
// - strikte Trennung Vorschlag (previewNaechsteNummer, kein Lock, kein Hochzaehlen)
//   und Reservierung (issueNextNumber, MIT Lock und Hochzaehlen) - siehe die in
//   ERP v1 gefundene Lektion (doppelte Nummern durch fehlende Trennung)
@Injectable()
export class NummernkreisService {
  constructor(private readonly dataSource: DataSource) {}

  // Fuer die Verwaltungs-UI (Modul Stammdaten/System-Einstellungen) - liefert
  // alle Nummernkreise inkl. aktuellem Stand (naechste Nummer siehe
  // previewNaechsteNummer, hier nur die Rohdaten).
  async liste(): Promise<Nummernkreis[]> {
    await this.ensureNummernkreise();
    return this.dataSource.getRepository(Nummernkreis).find({ order: { entityKey: 'ASC' } });
  }

  // prefix/stellen sind jederzeit aenderbar (betreffen nur die Formatierung
  // kuenftiger Nummern, analog firma.artikelnummernStellen). startValue
  // dagegen NUR, solange der Kreis noch unbenutzt ist (naechster Wert ==
  // Startwert) - sonst koennten bereits vergebene Nummern erneut vergeben
  // werden (siehe architecture.md Abschnitt 6).
  async aktualisieren(entityKey: string, dto: NummernkreisAktualisierenDto): Promise<Nummernkreis> {
    const repo = this.dataSource.getRepository(Nummernkreis);
    const kreis = await repo.findOneBy({ entityKey });
    if (!kreis) {
      throw new NotFoundException(`Nummernkreis '${entityKey}' nicht gefunden.`);
    }
    if (dto.prefix !== undefined) kreis.prefix = dto.prefix;
    if (dto.stellen !== undefined) kreis.stellen = dto.stellen;
    if (dto.startValue !== undefined) {
      if (kreis.nextValue !== kreis.startValue) {
        throw new ConflictException(
          `Startwert von '${entityKey}' kann nicht mehr geaendert werden - es wurde bereits mindestens eine Nummer vergeben.`,
        );
      }
      kreis.startValue = dto.startValue;
      kreis.nextValue = dto.startValue;
    }
    return repo.save(kreis);
  }

  async ensureNummernkreise(): Promise<void> {
    const repo = this.dataSource.getRepository(Nummernkreis);
    const vorhandene = new Set((await repo.find()).map((n) => n.entityKey));
    const fehlende = Object.entries(NUMMERNKREIS_DEFAULT_LABELS)
      .filter(([key]) => !vorhandene.has(key))
      .map(([entityKey, label]) => repo.create({ entityKey, label, prefix: '', startValue: 1 }));
    if (fehlende.length > 0) {
      await repo.save(fehlende);
    }
  }

  async previewNaechsteNummer(entityKey: string): Promise<string> {
    await this.ensureNummernkreise();
    const kreis = await this.dataSource.getRepository(Nummernkreis).findOneByOrFail({ entityKey });
    return this.formatiere(kreis);
  }

  async issueNextNumber(entityKey: string): Promise<string> {
    await this.ensureNummernkreise();
    return this.dataSource.transaction(async (manager) => {
      const kreis = await manager
        .createQueryBuilder(Nummernkreis, 'nk')
        .setLock('pessimistic_write') // entspricht SELECT ... FOR UPDATE
        .where('nk.entity_key = :entityKey', { entityKey })
        .getOneOrFail();

      const nummer = this.formatiere(kreis);
      kreis.nextValue += 1;
      await manager.save(kreis);
      return nummer;
    });
  }

  private formatiere(kreis: Nummernkreis): string {
    return `${kreis.prefix}${String(kreis.nextValue).padStart(kreis.stellen, '0')}`;
  }
}
