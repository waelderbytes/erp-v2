import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Bestellung } from '../../database/entities/bestellung.entity';
import { Bestellposition } from '../../database/entities/bestellposition.entity';
import { NummernkreisService } from '../nummernkreis/nummernkreis.service';
import { LagerbewegungService } from '../lager/lagerbewegung.service';
import { BestellungAnlegenDto } from './dto/bestellung-anlegen.dto';
import { WareneingangBuchenDto } from './dto/wareneingang-buchen.dto';

// Referenz-Typ-Konstante fuer lagerbewegung.referenz_typ - siehe Migration
// 0005_einkauf_bestellwesen.ts.
const REFERENZ_TYP_BESTELLPOSITION = 'bestellposition';

@Injectable()
export class EinkaufService {
  constructor(
    @InjectRepository(Bestellung) private readonly bestellungRepo: Repository<Bestellung>,
    @InjectRepository(Bestellposition) private readonly bestellpositionRepo: Repository<Bestellposition>,
    private readonly dataSource: DataSource,
    private readonly nummernkreisService: NummernkreisService,
    private readonly lagerbewegungService: LagerbewegungService,
  ) {}

  async anlegen(dto: BestellungAnlegenDto): Promise<Bestellung> {
    const bestellnummer = await this.nummernkreisService.issueNextNumber('bestellungen');
    const bestellung = this.bestellungRepo.create({
      bestellnummer,
      lieferantId: dto.lieferantId,
      erwartetesLieferdatum: dto.erwartetesLieferdatum ?? null,
      kommentar: dto.kommentar ?? null,
      positionen: dto.positionen.map((p) => ({
        artikelId: p.artikelId,
        menge: p.menge,
        einzelpreis: p.einzelpreis ?? null,
      })),
    });
    return this.bestellungRepo.save(bestellung);
  }

  liste(): Promise<Bestellung[]> {
    return this.bestellungRepo.find({ order: { createdAt: 'DESC' }, relations: ['lieferant'] });
  }

  find(id: string): Promise<Bestellung | null> {
    return this.bestellungRepo.findOne({ where: { id }, relations: ['lieferant', 'positionen', 'positionen.artikel'] });
  }

  // Uebergang offen -> bestellt. Bewusst kein Zurueck von 'bestellt' auf 'offen' im
  // MVP - Stornierung ist ein eigener, spaeter zu ergaenzender Pfad
  // (status = 'storniert'), kein einfaches Zuruecksetzen.
  async bestellen(id: string): Promise<Bestellung> {
    const bestellung = await this.bestellungRepo.findOneByOrFail({ id });
    if (bestellung.status !== 'offen') {
      throw new BadRequestException(`Bestellung ist bereits im Status '${bestellung.status}', kann nicht erneut bestellt werden.`);
    }
    bestellung.status = 'bestellt';
    bestellung.updatedAt = new Date();
    return this.bestellungRepo.save(bestellung);
  }

  // Bucht einen (Teil-)Wareneingang auf eine Bestellposition: erhoeht
  // gelieferte_menge auf der Position UND den tatsaechlichen Lagerbestand (ueber
  // lagerbewegung.service.ts, gleiche Transaktion) - beides muss atomar zusammen
  // gelten, sonst laufen Bestellstatus und echter Bestand auseinander.
  async wareneingangBuchen(dto: WareneingangBuchenDto, gebuchtVon: string): Promise<Bestellposition> {
    return this.dataSource.transaction(async (manager) => {
      const position = await manager.findOne(Bestellposition, {
        where: { id: dto.positionId },
        relations: ['bestellung'],
      });
      if (!position) {
        throw new NotFoundException('Bestellposition nicht gefunden.');
      }
      const restmenge = Number(position.menge) - Number(position.gelieferteMenge);
      if (Number(dto.menge) > restmenge) {
        throw new BadRequestException(
          `Gebuchte Menge (${dto.menge}) uebersteigt die Restmenge dieser Position (${restmenge.toFixed(3)}).`,
        );
      }

      await this.lagerbewegungService.wareneingangInTransaktion(
        manager,
        { artikelId: position.artikelId, lagerId: dto.lagerId, menge: dto.menge, kommentar: dto.kommentar },
        gebuchtVon,
        { typ: REFERENZ_TYP_BESTELLPOSITION, id: position.id },
      );

      position.gelieferteMenge = (Number(position.gelieferteMenge) + Number(dto.menge)).toFixed(3);
      await manager.save(position);

      await this.aktualisiereBestellstatus(manager, position.bestellungId);
      return position;
    });
  }

  private async aktualisiereBestellstatus(manager: EntityManager, bestellungId: string): Promise<void> {
    const positionen = await manager.find(Bestellposition, { where: { bestellungId } });
    const vollstaendigGeliefert = positionen.every((p) => Number(p.gelieferteMenge) >= Number(p.menge));
    const teilweiseGeliefert = positionen.some((p) => Number(p.gelieferteMenge) > 0);

    const neuerStatus = vollstaendigGeliefert ? 'abgeschlossen' : teilweiseGeliefert ? 'teilweise_geliefert' : undefined;
    if (!neuerStatus) {
      return;
    }
    await manager
      .createQueryBuilder()
      .update(Bestellung)
      .set({ status: neuerStatus, updatedAt: new Date() })
      .where('id = :id', { id: bestellungId })
      .execute();
  }
}
