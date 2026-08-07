import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Benutzer } from '../../database/entities/benutzer.entity';
import { Rolle } from '../../database/entities/rolle.entity';
import { PasswortService } from '../auth/passwort.service';
import { BenutzerAnlegenDto } from './dto/benutzer-anlegen.dto';
import { BenutzerAktualisierenDto } from './dto/benutzer-aktualisieren.dto';
import { PasswortSetzenDto } from './dto/passwort-setzen.dto';
import { PinSetzenDto } from './dto/pin-setzen.dto';
import { RolleZuweisenDto } from './dto/rolle-zuweisen.dto';

// Alle nach aussen (Controller) zurueckgegebenen Benutzer-Objekte laufen durch
// oeffentlich() - passwortHash/pinHash sind Argon2-Hashes und wuerden ohne
// diesen Schritt einfach als JSON-Feld mitgeschickt (kein globaler
// ClassSerializerInterceptor/@Exclude im Projekt, siehe main.ts). Kein Geheimnis
// im engeren Sinne (Hash != Klartext), aber unnoetige Angriffsflaeche - gehoert
// grundsaetzlich nie in eine API-Antwort.
type OeffentlicherBenutzer = Omit<Benutzer, 'passwortHash' | 'pinHash'>;

@Injectable()
export class BenutzerService {
  constructor(
    @InjectRepository(Benutzer) private readonly benutzerRepo: Repository<Benutzer>,
    @InjectRepository(Rolle) private readonly rolleRepo: Repository<Rolle>,
    private readonly passwortService: PasswortService,
  ) {}

  private oeffentlich(benutzer: Benutzer): OeffentlicherBenutzer {
    const { passwortHash, pinHash, ...rest } = benutzer;
    return rest;
  }

  // Internes Laden mit vollem Entity (inkl. Hashes) - nur fuer Methoden in
  // dieser Klasse, die den Hash selbst brauchen (z.B. zum Ueberschreiben) oder
  // die Relation weiterreichen. NIE direkt an einen Controller zurueckgeben.
  private async intern(id: string): Promise<Benutzer> {
    const benutzer = await this.benutzerRepo.findOne({
      where: { id },
      relations: ['rollen', 'rollen.berechtigungen'],
    });
    if (!benutzer) {
      throw new NotFoundException('Benutzer nicht gefunden.');
    }
    return benutzer;
  }

  async anlegen(dto: BenutzerAnlegenDto): Promise<OeffentlicherBenutzer> {
    let rollen: Rolle[] = [];
    if (dto.rollenIds?.length) {
      rollen = await this.rolleRepo.findBy({ id: In(dto.rollenIds) });
      if (rollen.length !== dto.rollenIds.length) {
        throw new NotFoundException('Mindestens eine der angegebenen Rollen wurde nicht gefunden.');
      }
    }

    const benutzer = this.benutzerRepo.create({
      email: dto.email,
      passwortHash: await this.passwortService.hash(dto.passwort),
      vorname: dto.vorname,
      nachname: dto.nachname,
      rollen,
    });

    try {
      const gespeichert = await this.benutzerRepo.save(benutzer);
      return this.oeffentlich(gespeichert);
    } catch (e) {
      // Postgres-Fehlercode 23505 = unique_violation (siehe benutzer.email UNIQUE,
      // Migration 0001) - gleiches Muster wie artikel.service.ts.
      if ((e as { code?: string }).code === '23505') {
        throw new ConflictException(`Ein Benutzer mit der E-Mail-Adresse '${dto.email}' existiert bereits.`);
      }
      throw e;
    }
  }

  async liste(): Promise<OeffentlicherBenutzer[]> {
    const benutzer = await this.benutzerRepo.find({ relations: ['rollen'], order: { createdAt: 'ASC' } });
    return benutzer.map((b) => this.oeffentlich(b));
  }

  async finden(id: string): Promise<OeffentlicherBenutzer> {
    return this.oeffentlich(await this.intern(id));
  }

  async aktualisieren(id: string, dto: BenutzerAktualisierenDto): Promise<OeffentlicherBenutzer> {
    const benutzer = await this.intern(id);
    if (dto.vorname !== undefined) benutzer.vorname = dto.vorname;
    if (dto.nachname !== undefined) benutzer.nachname = dto.nachname;
    if (dto.aktiv !== undefined) benutzer.aktiv = dto.aktiv;
    if (dto.personalnummer !== undefined) benutzer.personalnummer = dto.personalnummer;
    if (dto.rfidUid !== undefined) benutzer.rfidUid = dto.rfidUid;

    try {
      const gespeichert = await this.benutzerRepo.save(benutzer);
      return this.oeffentlich(gespeichert);
    } catch (e) {
      // Partielle Unique-Indizes auf personalnummer/rfid_uid, siehe Migration 0002.
      if ((e as { code?: string }).code === '23505') {
        throw new ConflictException('Personalnummer oder RFID-UID ist bereits einem anderen Benutzer zugewiesen.');
      }
      throw e;
    }
  }

  async passwortSetzen(id: string, dto: PasswortSetzenDto): Promise<{ ok: true }> {
    const benutzer = await this.intern(id);
    benutzer.passwortHash = await this.passwortService.hash(dto.neuesPasswort);
    await this.benutzerRepo.save(benutzer);
    return { ok: true };
  }

  async pinSetzen(id: string, dto: PinSetzenDto): Promise<{ ok: true }> {
    const benutzer = await this.intern(id);
    benutzer.pinHash = await this.passwortService.hash(dto.pin);
    await this.benutzerRepo.save(benutzer);
    return { ok: true };
  }

  // Ueber die Relation-QueryBuilder statt geladener Collection + save() -
  // vermeidet, das komplette benutzer.rollen-Array laden/neu schreiben zu
  // muessen, und macht die Absicht (genau eine Zeile in benutzer_rolle
  // hinzufuegen/entfernen) explizit.
  async rolleZuweisen(id: string, dto: RolleZuweisenDto): Promise<OeffentlicherBenutzer> {
    await this.intern(id); // wirft 404, falls Benutzer nicht existiert
    const rolle = await this.rolleRepo.findOneBy({ id: dto.rolleId });
    if (!rolle) {
      throw new NotFoundException('Rolle nicht gefunden.');
    }
    try {
      await this.benutzerRepo.createQueryBuilder().relation(Benutzer, 'rollen').of(id).add(dto.rolleId);
    } catch (e) {
      // benutzer_rolle-PK ist (benutzer_id, rolle_id) - Rolle war bereits zugewiesen.
      if ((e as { code?: string }).code !== '23505') {
        throw e;
      }
    }
    return this.finden(id);
  }

  async rolleEntziehen(id: string, rolleId: string): Promise<OeffentlicherBenutzer> {
    await this.intern(id);
    await this.benutzerRepo.createQueryBuilder().relation(Benutzer, 'rollen').of(id).remove(rolleId);
    return this.finden(id);
  }
}
