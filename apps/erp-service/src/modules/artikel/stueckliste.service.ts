import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artikel } from '../../database/entities/artikel.entity';
import { StuecklistePosition } from '../../database/entities/stueckliste-position.entity';
import { StecklistePositionAnlegenDto } from './dto/stueckliste-position-anlegen.dto';
import { StecklistePositionAktualisierenDto } from './dto/stueckliste-position-aktualisieren.dto';

// Baumknoten der rekursiv aufgeloesten Stueckliste (fuer die druckbare
// "Strukturstueckliste" - alle Ebenen auf einmal, siehe GET .../aufgeloest).
export interface StuecklisteKnoten {
  positionId: string | null; // null fuer die Wurzel (der Kopf-Artikel selbst)
  artikel: Artikel;
  // Menge bezogen auf 1 Einheit des DIREKTEN Elternteils.
  menge: string;
  // Kumulierte Menge bezogen auf 1 Einheit des Wurzel-Artikels (Menge dieser
  // Ebene * effektiveMenge des Elternteils) - das ist die Zahl, die man fuer
  // "wie viel brauche ich insgesamt" tatsaechlich braucht.
  effektiveMenge: string;
  kinder: StuecklisteKnoten[];
}

// Roadmap-Punkt "Stueckliste (BOM)", mehrstufig (Nutzerentscheidung
// 08.08.2026, siehe stueckliste-position.entity.ts). Zirkelbezug-Schutz ist
// hier im Service (nicht per DB-Constraint) implementiert, da eine
// rekursive Pruefung ("enthaelt Artikel B bereits Artikel A irgendwo in
// seiner eigenen Stueckliste") nicht als einfache CHECK-Constraint
// abbildbar ist.
@Injectable()
export class StuecklisteService {
  constructor(
    @InjectRepository(Artikel) private readonly artikelRepo: Repository<Artikel>,
    @InjectRepository(StuecklistePosition) private readonly positionRepo: Repository<StuecklistePosition>,
  ) {}

  positionen(kopfArtikelId: string): Promise<StuecklistePosition[]> {
    return this.positionRepo.find({
      where: { kopfArtikelId },
      relations: ['positionArtikel', 'positionArtikel.einheit'],
      order: { sortierung: 'ASC' },
    });
  }

  // BFS ueber die (bereits bestehende) Stueckliste von positionArtikelId:
  // wenn kopfArtikelId dabei irgendwo erreicht wird, wuerde das Hinzufuegen
  // dieser Position einen Zirkelbezug erzeugen (kopf wuerde dann - direkt
  // oder ueber mehrere Ebenen - sich selbst enthalten).
  private async wuerdeZyklusErzeugen(kopfArtikelId: string, positionArtikelId: string): Promise<boolean> {
    const besucht = new Set<string>();
    const warteschlange = [positionArtikelId];
    while (warteschlange.length > 0) {
      const aktuelle = warteschlange.shift()!;
      if (aktuelle === kopfArtikelId) return true;
      if (besucht.has(aktuelle)) continue;
      besucht.add(aktuelle);
      const kinder = await this.positionRepo.find({ where: { kopfArtikelId: aktuelle } });
      warteschlange.push(...kinder.map((k) => k.positionArtikelId));
    }
    return false;
  }

  async hinzufuegen(kopfArtikelId: string, dto: StecklistePositionAnlegenDto): Promise<StuecklistePosition> {
    const kopf = await this.artikelRepo.findOneBy({ id: kopfArtikelId });
    if (!kopf) throw new NotFoundException('Artikel nicht gefunden.');
    if (kopf.artikelart !== 'fertigungsartikel') {
      throw new ConflictException('Nur Fertigungsartikel können eine Stückliste haben.');
    }
    if (dto.positionArtikelId === kopfArtikelId) {
      throw new ConflictException('Ein Artikel kann nicht sich selbst als Stücklisten-Position enthalten.');
    }
    const positionArtikel = await this.artikelRepo.findOneBy({ id: dto.positionArtikelId });
    if (!positionArtikel) throw new NotFoundException('Positions-Artikel nicht gefunden.');

    if (await this.wuerdeZyklusErzeugen(kopfArtikelId, dto.positionArtikelId)) {
      throw new ConflictException(
        `'${positionArtikel.bezeichnung}' enthält (direkt oder indirekt) bereits '${kopf.bezeichnung}' - das würde einen Zirkelbezug erzeugen.`,
      );
    }

    const position = this.positionRepo.create({
      kopfArtikelId,
      positionArtikelId: dto.positionArtikelId,
      menge: dto.menge,
      sortierung: dto.sortierung ?? 0,
    });
    try {
      return await this.positionRepo.save(position);
    } catch (e) {
      // Postgres-Fehlercode 23505 = unique_violation (siehe Migration 0012,
      // UNIQUE(kopf_artikel_id, position_artikel_id)) - durchgaengiges
      // Pattern im Projekt.
      if ((e as { code?: string }).code === '23505') {
        throw new ConflictException(
          `'${positionArtikel.bezeichnung}' ist bereits Teil dieser Stückliste - Menge stattdessen anpassen.`,
        );
      }
      throw e;
    }
  }

  async aktualisieren(
    kopfArtikelId: string,
    positionId: string,
    dto: StecklistePositionAktualisierenDto,
  ): Promise<StuecklistePosition> {
    const position = await this.positionRepo.findOneBy({ id: positionId, kopfArtikelId });
    if (!position) throw new NotFoundException('Stücklisten-Position nicht gefunden.');
    if (dto.menge !== undefined) position.menge = dto.menge;
    if (dto.sortierung !== undefined) position.sortierung = dto.sortierung;
    return this.positionRepo.save(position);
  }

  async entfernen(kopfArtikelId: string, positionId: string): Promise<void> {
    const position = await this.positionRepo.findOneBy({ id: positionId, kopfArtikelId });
    if (!position) throw new NotFoundException('Stücklisten-Position nicht gefunden.');
    await this.positionRepo.remove(position);
  }

  async aufgeloest(kopfArtikelId: string): Promise<StuecklisteKnoten> {
    const kopf = await this.artikelRepo.findOneBy({ id: kopfArtikelId });
    if (!kopf) throw new NotFoundException('Artikel nicht gefunden.');
    return this.knotenAufloesen(kopf, null, '1', '1', new Set([kopfArtikelId]));
  }

  private async knotenAufloesen(
    artikel: Artikel,
    positionId: string | null,
    menge: string,
    effektiveMenge: string,
    pfad: Set<string>,
  ): Promise<StuecklisteKnoten> {
    const positionen = await this.positionRepo.find({
      where: { kopfArtikelId: artikel.id },
      relations: ['positionArtikel', 'positionArtikel.einheit'],
      order: { sortierung: 'ASC' },
    });
    const kinder: StuecklisteKnoten[] = [];
    for (const p of positionen) {
      // Defensive Zirkelbezug-Bremse: sollte durch die Pruefung in
      // hinzufuegen() nicht mehr vorkommen koennen, schuetzt aber trotzdem
      // vor einer Endlosschleife (z.B. bei manuell in der DB eingespielten
      // Altdaten) statt den Request haengen zu lassen.
      if (pfad.has(p.positionArtikelId)) continue;
      const kindEffektiveMenge = (Number(effektiveMenge) * Number(p.menge)).toFixed(3);
      kinder.push(
        await this.knotenAufloesen(
          p.positionArtikel,
          p.id,
          p.menge,
          kindEffektiveMenge,
          new Set([...pfad, p.positionArtikelId]),
        ),
      );
    }
    return { positionId, artikel, menge, effektiveMenge, kinder };
  }
}
