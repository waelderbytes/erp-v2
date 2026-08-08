import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Beleg, BelegTyp } from '../../database/entities/beleg.entity';
import { BelegPosition } from '../../database/entities/beleg-position.entity';
import { Artikel } from '../../database/entities/artikel.entity';
import { Steuersatz } from '../../database/entities/steuersatz.entity';
import { Lager } from '../../database/entities/lager.entity';
import { NummernkreisService } from '../nummernkreis/nummernkreis.service';
import { PreisfindungService } from '../preisfindung/preisfindung.service';
import { LagerbewegungService } from '../lager/lagerbewegung.service';
import { BelegAnlegenDto } from './dto/beleg-anlegen.dto';
import { BelegPositionEingabeDto } from './dto/beleg-position-eingabe.dto';
import { BelegUebernehmenDto } from './dto/beleg-uebernehmen.dto';

// Reihenfolge der Verkaufs-Belegkette. NUR fuer die "Uebernehmen"-Aktion
// relevant - jeder Typ kann trotzdem auch direkt/frei angelegt werden (siehe
// anlegen()), nicht zwingend ueber die Kette von vorne. Bewusst eigenstaendig
// entworfen, NICHT aus v1 uebernommen (Nutzerentscheidung 08.08.2026) - v1
// hatte hier zusaetzlich Anfrage/Bestellung/Wareneingang (Einkaufskette) im
// selben Modell und "zusatz_nachfolger" (Proforma/Abschlag), beides bewusst
// nicht mitgenommen: Einkauf ist in erp-v2 ein eigenes, bereits fertiges
// Modul (einkauf.service.ts), Proforma/Abschlag folgen erst, wenn ein
// konkreter Bedarf danach entsteht.
const BELEG_KETTE: Record<BelegTyp, BelegTyp | null> = {
  angebot: 'auftragsbestaetigung',
  auftragsbestaetigung: 'lieferschein',
  lieferschein: 'rechnung',
  rechnung: null,
};

const BELEG_TYPEN: BelegTyp[] = ['angebot', 'auftragsbestaetigung', 'lieferschein', 'rechnung'];

const NUMMERNKREIS_JE_TYP: Record<BelegTyp, string> = {
  angebot: 'angebote',
  auftragsbestaetigung: 'auftragsbestaetigungen',
  lieferschein: 'lieferscheine',
  rechnung: 'rechnungen',
};

// referenz_typ-Konstante fuer lagerbewegung.referenz_typ, analog
// REFERENZ_TYP_BESTELLPOSITION in einkauf.service.ts.
const REFERENZ_TYP_BELEGPOSITION = 'beleg_position';

@Injectable()
export class BelegService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly nummernkreisService: NummernkreisService,
    private readonly preisfindungService: PreisfindungService,
    private readonly lagerbewegungService: LagerbewegungService,
  ) {}

  private pruefeTyp(typ: string): BelegTyp {
    if (!BELEG_TYPEN.includes(typ as BelegTyp)) {
      throw new BadRequestException(`Unbekannter Belegtyp '${typ}'. Erlaubt: ${BELEG_TYPEN.join(', ')}.`);
    }
    return typ as BelegTyp;
  }

  liste(typ: string): Promise<Beleg[]> {
    return this.dataSource.getRepository(Beleg).find({
      where: { belegTyp: this.pruefeTyp(typ) },
      order: { belegdatum: 'DESC', belegnummer: 'DESC' },
      relations: ['kunde'],
    });
  }

  find(id: string): Promise<Beleg | null> {
    return this.dataSource.getRepository(Beleg).findOne({
      where: { id },
      relations: ['kunde', 'referenzBeleg', 'positionen', 'positionen.artikel', 'positionen.steuersatz'],
    });
  }

  // Direktes Anlegen ohne Vorgaenger - jeder Belegtyp kann so gestartet werden
  // (z.B. Lieferschein ohne vorherige Auftragsbestaetigung fuer einen
  // Spontanverkauf). Preise/Steuersaetze/Bezeichnung werden pro Position ueber
  // loesePositionAuf() aufgeloest (Snapshot).
  async anlegen(typRaw: string, dto: BelegAnlegenDto): Promise<Beleg> {
    const typ = this.pruefeTyp(typRaw);
    const belegnummer = await this.nummernkreisService.issueNextNumber(NUMMERNKREIS_JE_TYP[typ]);

    return this.dataSource.transaction(async (manager) => {
      const positionen: Partial<BelegPosition>[] = [];
      let positionNr = 1;
      for (const posDto of dto.positionen) {
        positionen.push({ ...(await this.loesePositionAuf(posDto, dto.kundeId)), positionNr: positionNr++ });
      }

      const beleg = manager.create(Beleg, {
        belegTyp: typ,
        belegnummer,
        kundeId: dto.kundeId,
        belegdatum: dto.belegdatum ?? undefined,
        kommentar: dto.kommentar ?? null,
        positionen: positionen as BelegPosition[],
      });
      const gespeichert = await manager.save(beleg);

      if (typ === 'lieferschein') {
        await this.bucheWarenausgang(manager, gespeichert.positionen, dto.lagerId, 'system');
      }
      return gespeichert;
    });
  }

  // Loest eine BelegPositionEingabeDto in einen vollstaendigen Snapshot auf:
  // - mit artikelId: Bezeichnung/Einheit/Steuersatz kommen vom Artikel, sofern
  //   nicht explizit ueberschrieben; Preis wird ueber die bestehende
  //   Preisfindung ermittelt, sofern nicht explizit angegeben.
  // - ohne artikelId: reine Freitext-Position, bezeichnung/einzelpreis/
  //   steuersatzId sind dann Pflicht (kein Artikel zum Ableiten vorhanden).
  private async loesePositionAuf(
    posDto: BelegPositionEingabeDto,
    kundeId: string,
  ): Promise<Omit<Partial<BelegPosition>, 'positionNr'>> {
    const repo = this.dataSource.getRepository(Artikel);
    let artikel: Artikel | null = null;
    if (posDto.artikelId) {
      artikel = await repo.findOne({ where: { id: posDto.artikelId }, relations: ['einheit', 'steuersatz'] });
      if (!artikel) {
        throw new NotFoundException(`Artikel '${posDto.artikelId}' nicht gefunden.`);
      }
    }

    if (!artikel && !posDto.bezeichnung) {
      throw new BadRequestException('Ohne artikelId ist bezeichnung Pflicht (Freitext-Position).');
    }

    let steuersatzId = posDto.steuersatzId ?? artikel?.steuersatzId ?? null;
    let steuersatzProzent: string;
    if (posDto.steuersatzId) {
      const steuersatz = await this.dataSource.getRepository(Steuersatz).findOneBy({ id: posDto.steuersatzId });
      if (!steuersatz) {
        throw new NotFoundException(`Steuersatz '${posDto.steuersatzId}' nicht gefunden.`);
      }
      steuersatzProzent = steuersatz.satz;
    } else if (artikel?.steuersatz) {
      steuersatzProzent = artikel.steuersatz.satz;
    } else {
      throw new BadRequestException('Ohne artikelId ist steuersatzId Pflicht (kein Artikel zum Ableiten vorhanden).');
    }

    let einzelpreis = posDto.einzelpreis;
    if (!einzelpreis) {
      if (!artikel) {
        throw new BadRequestException('Ohne artikelId ist einzelpreis Pflicht (kein Artikel fuer Preisfindung vorhanden).');
      }
      try {
        const ermittelt = await this.preisfindungService.ermitteln({
          artikelId: artikel.id,
          kundeId,
          menge: posDto.menge,
        });
        einzelpreis = ermittelt.preisNetto;
      } catch {
        throw new BadRequestException(
          `Kein Preis fuer Artikel '${artikel.artikelnummer}' hinterlegt - bitte einzelpreis manuell angeben.`,
        );
      }
    }

    return {
      artikelId: artikel?.id ?? null,
      bezeichnung: posDto.bezeichnung ?? artikel!.bezeichnung,
      menge: posDto.menge,
      weitergefuehrteMenge: '0',
      einheitCode: posDto.einheitCode ?? artikel?.einheit?.code ?? null,
      einzelpreis,
      steuersatzId,
      steuersatzProzent,
    };
  }

  // Wandelt (Teile von) einem Beleg in den Nachfolgetyp um. Kernstueck der
  // Belegkette - siehe Modul-Kommentar oben zu BELEG_KETTE. Jede Zielposition
  // bekommt die Preis-/Steuersatz-Snapshots 1:1 von der Vorgaengerposition
  // (bewusst KEINE Neuermittlung - was im Vorgaenger vereinbart wurde, gilt
  // weiter), nur die Menge kann eine Teilmenge sein.
  async uebernehmen(belegId: string, dto: BelegUebernehmenDto, gebuchtVon: string): Promise<Beleg> {
    const vorgaenger = await this.dataSource.getRepository(Beleg).findOneBy({ id: belegId });
    if (!vorgaenger) {
      throw new NotFoundException('Beleg nicht gefunden.');
    }
    if (vorgaenger.status === 'storniert') {
      throw new ConflictException('Ein stornierter Beleg kann nicht weitergefuehrt werden.');
    }
    const zielTyp = BELEG_KETTE[vorgaenger.belegTyp];
    if (!zielTyp) {
      throw new BadRequestException(`'${vorgaenger.belegTyp}' hat keinen Nachfolge-Belegtyp.`);
    }

    const belegnummer = await this.nummernkreisService.issueNextNumber(NUMMERNKREIS_JE_TYP[zielTyp]);

    return this.dataSource.transaction(async (manager) => {
      const neuePositionen: Partial<BelegPosition>[] = [];
      let positionNr = 1;

      for (const ziel of dto.positionen) {
        // Row-Lock: zwei gleichzeitige Teil-Uebernahmen derselben Position
        // duerfen sich nicht gegenseitig ueberschreiben (gleiches Muster wie
        // Nummernkreis-Engine/Lagerbestand, siehe architecture.md Abschnitt 6).
        const vorgaengerPos = await manager
          .createQueryBuilder(BelegPosition, 'bp')
          .setLock('pessimistic_write')
          .where('bp.id = :id AND bp.beleg_id = :belegId', { id: ziel.positionId, belegId })
          .getOne();
        if (!vorgaengerPos) {
          throw new NotFoundException(`Position '${ziel.positionId}' gehoert nicht zu diesem Beleg.`);
        }
        const restmenge = Number(vorgaengerPos.menge) - Number(vorgaengerPos.weitergefuehrteMenge);
        if (Number(ziel.menge) > restmenge) {
          throw new BadRequestException(
            `Angeforderte Menge (${ziel.menge}) uebersteigt die Restmenge dieser Position (${restmenge.toFixed(3)}).`,
          );
        }

        vorgaengerPos.weitergefuehrteMenge = (Number(vorgaengerPos.weitergefuehrteMenge) + Number(ziel.menge)).toFixed(3);
        await manager.save(vorgaengerPos);

        neuePositionen.push({
          positionNr: positionNr++,
          artikelId: vorgaengerPos.artikelId,
          bezeichnung: vorgaengerPos.bezeichnung,
          menge: ziel.menge,
          weitergefuehrteMenge: '0',
          einheitCode: vorgaengerPos.einheitCode,
          einzelpreis: vorgaengerPos.einzelpreis,
          steuersatzId: vorgaengerPos.steuersatzId,
          steuersatzProzent: vorgaengerPos.steuersatzProzent,
          referenzPositionId: vorgaengerPos.id,
        });
      }

      const neuerBeleg = manager.create(Beleg, {
        belegTyp: zielTyp,
        belegnummer,
        kundeId: vorgaenger.kundeId,
        referenzBelegId: vorgaenger.id,
        positionen: neuePositionen as BelegPosition[],
      });
      const gespeichert = await manager.save(neuerBeleg);

      if (zielTyp === 'lieferschein') {
        await this.bucheWarenausgang(manager, gespeichert.positionen, dto.lagerId, gebuchtVon);
      }

      await this.aktualisiereBelegStatus(manager, belegId);
      return gespeichert;
    });
  }

  // Bucht fuer jede Position mit bestandsgefuehrtem Artikel einen Warenausgang
  // (siehe lagerbewegung.service.ts::warenausgangInTransaktion) - ausgeloest
  // durch das ANLEGEN eines Lieferscheins (das ist der fachliche Moment der
  // Warenbewegung), nicht erst durch die Rechnung. Ohne explizit angegebenes
  // Lager wird das Standardlager verwendet.
  private async bucheWarenausgang(
    manager: EntityManager,
    positionen: BelegPosition[],
    lagerId: string | undefined,
    gebuchtVon: string,
  ): Promise<void> {
    const bestandsgefuehrte = positionen.filter((p) => p.artikelId && Number(p.menge) > 0);
    if (bestandsgefuehrte.length === 0) {
      return;
    }
    let zielLagerId = lagerId;
    if (!zielLagerId) {
      const standardlager = await manager.findOneBy(Lager, { istStandard: true });
      if (!standardlager) {
        throw new BadRequestException(
          'Kein Lager angegeben und kein Standardlager konfiguriert - lagerId beim Anlegen/Uebernehmen mitgeben.',
        );
      }
      zielLagerId = standardlager.id;
    }
    for (const pos of bestandsgefuehrte) {
      const artikel = await manager.findOneBy(Artikel, { id: pos.artikelId! });
      if (!artikel?.bestandsgefuehrt) {
        continue; // Dienstleistungen etc. loesen keine Lagerbuchung aus.
      }
      await this.lagerbewegungService.warenausgangInTransaktion(
        manager,
        { artikelId: pos.artikelId!, lagerId: zielLagerId, menge: pos.menge },
        gebuchtVon,
        { typ: REFERENZ_TYP_BELEGPOSITION, id: pos.id },
      );
    }
  }

  // Analog aktualisiereBestellstatus in einkauf.service.ts.
  private async aktualisiereBelegStatus(manager: EntityManager, belegId: string): Promise<void> {
    const positionen = await manager.find(BelegPosition, { where: { belegId } });
    if (positionen.length === 0) {
      return;
    }
    const vollstaendigWeitergefuehrt = positionen.every((p) => Number(p.weitergefuehrteMenge) >= Number(p.menge));
    const teilweiseWeitergefuehrt = positionen.some((p) => Number(p.weitergefuehrteMenge) > 0);
    const neuerStatus = vollstaendigWeitergefuehrt ? 'abgeschlossen' : teilweiseWeitergefuehrt ? 'teilweise_weitergefuehrt' : 'offen';
    await manager
      .createQueryBuilder()
      .update(Beleg)
      .set({ status: neuerStatus, updatedAt: new Date() })
      .where('id = :id', { id: belegId })
      .execute();
  }

  async stornieren(id: string): Promise<Beleg> {
    const beleg = await this.dataSource.getRepository(Beleg).findOneBy({ id });
    if (!beleg) {
      throw new NotFoundException('Beleg nicht gefunden.');
    }
    if (beleg.festgeschrieben) {
      throw new ConflictException(
        'Ein festgeschriebener Beleg kann nicht storniert werden (GoBD-Unveraenderlichkeit) - eine Korrektur-/' +
          'Stornofunktion fuer festgeschriebene Rechnungen ist noch nicht umgesetzt.',
      );
    }
    beleg.status = 'storniert';
    beleg.updatedAt = new Date();
    return this.dataSource.getRepository(Beleg).save(beleg);
  }

  // Erster, bewusst einfacher Wurf ohne PDF-Kopplung (siehe Nutzerentscheidung
  // 08.08.2026: erst Datenmodell/Workflow, PDF als Folgeschritt) - spaeter soll
  // dies automatisch beim ersten PDF-Abruf einer Rechnung passieren, analog v1.
  async festschreiben(id: string): Promise<Beleg> {
    const beleg = await this.dataSource.getRepository(Beleg).findOneBy({ id });
    if (!beleg) {
      throw new NotFoundException('Beleg nicht gefunden.');
    }
    if (beleg.belegTyp !== 'rechnung') {
      throw new BadRequestException('Nur Rechnungen koennen festgeschrieben werden.');
    }
    if (beleg.status === 'storniert') {
      throw new ConflictException('Ein stornierter Beleg kann nicht festgeschrieben werden.');
    }
    beleg.festgeschrieben = true;
    beleg.updatedAt = new Date();
    return this.dataSource.getRepository(Beleg).save(beleg);
  }
}
