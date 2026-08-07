import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Steuersatz } from '../../database/entities/steuersatz.entity';
import { SteuersatzAnlegenDto } from './dto/steuersatz-anlegen.dto';
import { SteuersatzAktualisierenDto } from './dto/steuersatz-aktualisieren.dto';

@Injectable()
export class SteuersatzService {
  constructor(@InjectRepository(Steuersatz) private readonly steuersatzRepo: Repository<Steuersatz>) {}

  // Liefert ALLE Steuersaetze (auch deaktivierte), analog EinheitService.liste()
  // - das Frontend blendet Deaktivierte selbst passend aus/ein.
  liste(): Promise<Steuersatz[]> {
    return this.steuersatzRepo.find({ order: { satz: 'ASC' } });
  }

  async standard(): Promise<Steuersatz | null> {
    return this.steuersatzRepo.findOneBy({ istStandard: true });
  }

  async anlegen(dto: SteuersatzAnlegenDto): Promise<Steuersatz> {
    const steuersatz = this.steuersatzRepo.create({
      bezeichnung: dto.bezeichnung,
      satz: dto.satz,
      istStandard: false,
    });
    const gespeichert = await this.steuersatzRepo.save(steuersatz);
    if (dto.istStandard) {
      return this.alsStandardSetzen(gespeichert.id);
    }
    return gespeichert;
  }

  async aktualisieren(id: string, dto: SteuersatzAktualisierenDto): Promise<Steuersatz> {
    const steuersatz = await this.steuersatzRepo.findOneBy({ id });
    if (!steuersatz) {
      throw new NotFoundException('Steuersatz nicht gefunden.');
    }
    if (dto.bezeichnung !== undefined) steuersatz.bezeichnung = dto.bezeichnung;
    if (dto.satz !== undefined) steuersatz.satz = dto.satz;
    if (dto.aktiv !== undefined) {
      if (!dto.aktiv && steuersatz.istStandard) {
        throw new ConflictException(
          'Der Standard-Steuersatz kann nicht deaktiviert werden - vorher einen anderen als Standard setzen.',
        );
      }
      steuersatz.aktiv = dto.aktiv;
    }
    await this.steuersatzRepo.save(steuersatz);
    if (dto.istStandard) {
      return this.alsStandardSetzen(id);
    }
    return steuersatz;
  }

  // Genau 1 Standard-Steuersatz gleichzeitig - alle anderen werden in
  // derselben Transaktion zurueckgesetzt (analog zu Mustern wie
  // lager.istStandard, falls vorhanden - hier neu eingefuehrt fuer
  // Steuersatz, dient als Vorauswahl beim Artikel-Anlegen).
  async alsStandardSetzen(id: string): Promise<Steuersatz> {
    return this.steuersatzRepo.manager.transaction(async (manager) => {
      const repo = manager.getRepository(Steuersatz);
      const steuersatz = await repo.findOneBy({ id });
      if (!steuersatz) {
        throw new NotFoundException('Steuersatz nicht gefunden.');
      }
      if (!steuersatz.aktiv) {
        throw new ConflictException('Ein deaktivierter Steuersatz kann nicht Standard sein.');
      }
      await repo.update({ istStandard: true }, { istStandard: false });
      steuersatz.istStandard = true;
      return repo.save(steuersatz);
    });
  }
}
