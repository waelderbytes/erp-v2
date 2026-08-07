import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Zeitbuchung, ZeitbuchungTyp } from '../../database/entities/zeitbuchung.entity';
import { StempelnDto } from './dto/stempeln.dto';

export type Status = 'ausgestempelt' | 'eingestempelt' | 'pause';

// Erlaubte Uebergaenge je aktuellem Status - siehe docs/module-uebersicht.md
// "Zeiterfassung". Verhindert fachlichen Unsinn wie doppeltes Einstempeln oder
// eine Pause ohne vorheriges Kommt.
const ERLAUBTE_UEBERGAENGE: Record<Status, ZeitbuchungTyp[]> = {
  ausgestempelt: ['kommt'],
  eingestempelt: ['geht', 'pause_beginn'],
  pause: ['pause_ende'],
};

@Injectable()
export class ZeiterfassungService {
  constructor(@InjectRepository(Zeitbuchung) private readonly zeitbuchungRepo: Repository<Zeitbuchung>) {}

  async stempeln(benutzerId: string, dto: StempelnDto): Promise<Zeitbuchung> {
    const status = await this.aktuellerStatus(benutzerId);
    if (!ERLAUBTE_UEBERGAENGE[status].includes(dto.typ)) {
      throw new ConflictException(
        `Buchung '${dto.typ}' ist im aktuellen Status '${status}' nicht moeglich. Erlaubt: ${ERLAUBTE_UEBERGAENGE[status].join(', ')}.`,
      );
    }
    const buchung = this.zeitbuchungRepo.create({
      benutzerId,
      typ: dto.typ,
      quelle: dto.quelle,
      standortLat: dto.lat !== undefined ? String(dto.lat) : null,
      standortLng: dto.lng !== undefined ? String(dto.lng) : null,
      kommentar: dto.kommentar ?? null,
    });
    return this.zeitbuchungRepo.save(buchung);
  }

  async aktuellerStatus(benutzerId: string): Promise<Status> {
    const letzte = await this.zeitbuchungRepo.findOne({
      where: { benutzerId },
      order: { zeitpunkt: 'DESC' },
    });
    if (!letzte || letzte.typ === 'geht') return 'ausgestempelt';
    if (letzte.typ === 'pause_beginn') return 'pause';
    return 'eingestempelt'; // letzte.typ === 'kommt' || 'pause_ende'
  }

  buchungenHeute(benutzerId: string): Promise<Zeitbuchung[]> {
    return this.buchungenAmTag(benutzerId, new Date());
  }

  private buchungenAmTag(benutzerId: string, tag: Date): Promise<Zeitbuchung[]> {
    const von = new Date(tag);
    von.setHours(0, 0, 0, 0);
    const bis = new Date(tag);
    bis.setHours(23, 59, 59, 999);
    return this.zeitbuchungRepo
      .createQueryBuilder('z')
      .where('z.benutzer_id = :benutzerId', { benutzerId })
      .andWhere('z.zeitpunkt BETWEEN :von AND :bis', { von, bis })
      .orderBy('z.zeitpunkt', 'ASC')
      .getMany();
  }

  // Berechnet Arbeitszeit (aktive, nicht pausierte Intervalle) und Pausenzeit aus
  // den Buchungspaaren des Tages. Laufende (noch nicht abgeschlossene) Intervalle
  // werden bis "jetzt" mitgerechnet, damit die Anzeige waehrend eines laufenden
  // Arbeitstages sinnvolle Werte zeigt, nicht erst nach dem Ausstempeln.
  async arbeitszeitHeute(benutzerId: string): Promise<{ arbeitszeitMinuten: number; pausenzeitMinuten: number; status: Status }> {
    const buchungen = await this.buchungenHeute(benutzerId);
    let arbeitszeitMs = 0;
    let pausenzeitMs = 0;
    let intervallStart: Date | null = null;
    let inPause = false;

    for (const buchung of buchungen) {
      if (buchung.typ === 'kommt') {
        intervallStart = buchung.zeitpunkt;
        inPause = false;
      } else if (buchung.typ === 'pause_beginn' && intervallStart) {
        arbeitszeitMs += buchung.zeitpunkt.getTime() - intervallStart.getTime();
        intervallStart = buchung.zeitpunkt;
        inPause = true;
      } else if (buchung.typ === 'pause_ende' && intervallStart) {
        pausenzeitMs += buchung.zeitpunkt.getTime() - intervallStart.getTime();
        intervallStart = buchung.zeitpunkt;
        inPause = false;
      } else if (buchung.typ === 'geht' && intervallStart) {
        if (!inPause) {
          arbeitszeitMs += buchung.zeitpunkt.getTime() - intervallStart.getTime();
        }
        intervallStart = null;
      }
    }

    // Laufendes Intervall (noch nicht ausgestempelt/Pause noch nicht beendet) bis
    // jetzt mitrechnen.
    if (intervallStart) {
      const jetzt = new Date();
      if (inPause) {
        pausenzeitMs += jetzt.getTime() - intervallStart.getTime();
      } else {
        arbeitszeitMs += jetzt.getTime() - intervallStart.getTime();
      }
    }

    return {
      arbeitszeitMinuten: Math.round(arbeitszeitMs / 60000),
      pausenzeitMinuten: Math.round(pausenzeitMs / 60000),
      status: await this.aktuellerStatus(benutzerId),
    };
  }

  // Fuer Sachbearbeiter/Administrator - sieht alle Mitarbeiter, nicht nur sich
  // selbst (siehe RBAC-Unterscheidung im Controller: 'lesen' vs. 'schreiben').
  alleBuchungen(benutzerId?: string): Promise<Zeitbuchung[]> {
    return this.zeitbuchungRepo.find({
      where: benutzerId ? { benutzerId } : {},
      order: { zeitpunkt: 'DESC' },
    });
  }
}
