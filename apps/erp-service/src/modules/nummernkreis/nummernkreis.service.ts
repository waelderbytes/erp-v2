import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Nummernkreis } from '../../database/entities/nummernkreis.entity';
import { NUMMERNKREIS_DEFAULT_LABELS } from './nummernkreis.entity-labels';

// Siehe docs/architecture.md Abschnitt 6 fuer die volle Begruendung. Kernpunkte:
// - SELECT ... FOR UPDATE als Row-Lock statt Advisory-Lock/optimistischem Retry
// - strikte Trennung Vorschlag (previewNaechsteNummer, kein Lock, kein Hochzaehlen)
//   und Reservierung (issueNextNumber, MIT Lock und Hochzaehlen) - siehe die in
//   ERP v1 gefundene Lektion (doppelte Nummern durch fehlende Trennung)
@Injectable()
export class NummernkreisService {
  constructor(private readonly dataSource: DataSource) {}

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
