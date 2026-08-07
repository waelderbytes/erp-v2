import { ConflictException, Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { randomUUID } from 'crypto';
import { Lagerbestand } from '../../database/entities/lagerbestand.entity';
import { Lagerbewegung, LagerbewegungTyp } from '../../database/entities/lagerbewegung.entity';
import { WareneingangDto } from './dto/wareneingang.dto';
import { WarenausgangDto } from './dto/warenausgang.dto';
import { UmbuchungDto } from './dto/umbuchung.dto';
import { InventurDto } from './dto/inventur.dto';

// Race-condition-sicheres Buchen von Lagerbewegungen - gleiches Grundmuster wie die
// Nummernkreis-Engine (SELECT ... FOR UPDATE statt optimistischem Retry, siehe
// docs/architecture.md Abschnitt 6): ohne Row-Lock koennten zwei gleichzeitige
// Warenausgaenge denselben (veralteten) Bestand lesen und beide durchgehen, obwohl
// in Summe zu viel entnommen wuerde.
@Injectable()
export class LagerbewegungService {
  constructor(private readonly dataSource: DataSource) {}

  wareneingang(dto: WareneingangDto, gebuchtVon: string): Promise<Lagerbewegung> {
    return this.dataSource.transaction((manager) =>
      this.bucheDelta(manager, {
        artikelId: dto.artikelId,
        lagerId: dto.lagerId,
        typ: 'wareneingang',
        delta: dto.menge,
        kommentar: dto.kommentar ?? null,
        gebuchtVon,
      }),
    );
  }

  warenausgang(dto: WarenausgangDto, gebuchtVon: string): Promise<Lagerbewegung> {
    return this.dataSource.transaction((manager) =>
      this.bucheDelta(manager, {
        artikelId: dto.artikelId,
        lagerId: dto.lagerId,
        typ: 'warenausgang',
        delta: `-${dto.menge}`,
        kommentar: dto.kommentar ?? null,
        gebuchtVon,
      }),
    );
  }

  async umbuchung(dto: UmbuchungDto, gebuchtVon: string): Promise<{ ab: Lagerbewegung; zu: Lagerbewegung }> {
    if (dto.vonLagerId === dto.nachLagerId) {
      throw new ConflictException('Quell- und Ziellager duerfen bei einer Umbuchung nicht identisch sein.');
    }
    const gruppeId = randomUUID();
    return this.dataSource.transaction(async (manager) => {
      const ab = await this.bucheDelta(manager, {
        artikelId: dto.artikelId,
        lagerId: dto.vonLagerId,
        typ: 'umbuchung',
        delta: `-${dto.menge}`,
        kommentar: dto.kommentar ?? null,
        gebuchtVon,
        umbuchungGruppeId: gruppeId,
      });
      const zu = await this.bucheDelta(manager, {
        artikelId: dto.artikelId,
        lagerId: dto.nachLagerId,
        typ: 'umbuchung',
        delta: dto.menge,
        kommentar: dto.kommentar ?? null,
        gebuchtVon,
        umbuchungGruppeId: gruppeId,
      });
      return { ab, zu };
    });
  }

  inventur(dto: InventurDto, gebuchtVon: string): Promise<Lagerbewegung> {
    return this.dataSource.transaction(async (manager) => {
      const bestand = await this.leseOderErzeugeBestandGesperrt(manager, dto.artikelId, dto.lagerId);
      const delta = (Number(dto.neuerBestand) - Number(bestand.menge)).toFixed(3);
      // Inventurkorrektur darf den Bestand explizit auch auf 0 oder (bei Fehlbestand)
      // rechnerisch anpassen - deshalb hier KEINE Negativ-Pruefung wie bei den
      // anderen Bewegungsarten, das ist ja gerade der Zweck der Korrektur.
      return this.schreibeBewegung(manager, bestand, {
        artikelId: dto.artikelId,
        lagerId: dto.lagerId,
        typ: 'inventur_korrektur',
        delta,
        kommentar: dto.kommentar ?? null,
        gebuchtVon,
        umbuchungGruppeId: null,
      });
    });
  }

  private async bucheDelta(
    manager: EntityManager,
    params: {
      artikelId: string;
      lagerId: string;
      typ: LagerbewegungTyp;
      delta: string;
      kommentar: string | null;
      gebuchtVon: string;
      umbuchungGruppeId?: string;
    },
  ): Promise<Lagerbewegung> {
    const bestand = await this.leseOderErzeugeBestandGesperrt(manager, params.artikelId, params.lagerId);
    const neueMenge = Number(bestand.menge) + Number(params.delta);
    if (neueMenge < 0) {
      throw new ConflictException(
        `Nicht genug Bestand: verfuegbar ${bestand.menge}, angefragt ${Math.abs(Number(params.delta))}.`,
      );
    }
    return this.schreibeBewegung(manager, bestand, {
      artikelId: params.artikelId,
      lagerId: params.lagerId,
      typ: params.typ,
      delta: params.delta,
      kommentar: params.kommentar,
      gebuchtVon: params.gebuchtVon,
      umbuchungGruppeId: params.umbuchungGruppeId ?? null,
    });
  }

  private async schreibeBewegung(
    manager: EntityManager,
    bestand: Lagerbestand,
    params: {
      artikelId: string;
      lagerId: string;
      typ: LagerbewegungTyp;
      delta: string;
      kommentar: string | null;
      gebuchtVon: string;
      umbuchungGruppeId: string | null;
    },
  ): Promise<Lagerbewegung> {
    const neueMenge = (Number(bestand.menge) + Number(params.delta)).toFixed(3);
    bestand.menge = neueMenge;
    await manager.save(bestand);

    const bewegung = manager.create(Lagerbewegung, {
      artikelId: params.artikelId,
      lagerId: params.lagerId,
      typ: params.typ,
      menge: params.delta,
      umbuchungGruppeId: params.umbuchungGruppeId,
      kommentar: params.kommentar,
      gebuchtVon: params.gebuchtVon,
    });
    return manager.save(bewegung);
  }

  // Holt die Lagerbestand-Zeile MIT Row-Lock (SELECT ... FOR UPDATE) und legt sie
  // bei Bedarf zuerst mit menge=0 an (ON CONFLICT DO NOTHING deckt den Fall ab,
  // dass zwei parallele Buchungen gleichzeitig die erste Bewegung fuer ein neues
  // Artikel+Lager-Paar auslösen).
  private async leseOderErzeugeBestandGesperrt(
    manager: EntityManager,
    artikelId: string,
    lagerId: string,
  ): Promise<Lagerbestand> {
    await manager.query(
      `INSERT INTO lagerbestand (artikel_id, lager_id, menge) VALUES ($1, $2, 0)
       ON CONFLICT (artikel_id, lager_id) DO NOTHING`,
      [artikelId, lagerId],
    );
    return manager
      .createQueryBuilder(Lagerbestand, 'lb')
      .setLock('pessimistic_write')
      .where('lb.artikel_id = :artikelId AND lb.lager_id = :lagerId', { artikelId, lagerId })
      .getOneOrFail();
  }
}
