import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Benutzer } from '../../database/entities/benutzer.entity';
import { PasswortService } from '../auth/passwort.service';
import { TokenService } from '../auth/token.service';
import { KioskGeraetService } from './kiosk-geraet.service';
import { KioskIdentifizierenDto } from './dto/kiosk-identifizieren.dto';

// Reine Identifizierung fuer den Kiosk-Stempel-Flow (Wandtablet, kein voller
// ERP-Login) - siehe docs/module-uebersicht.md "Zeiterfassung". Gibt bewusst NUR
// einen Access-Token zurueck (kein Refresh-Token): der Ablauf ist
// antippen -> stempeln -> fertig, keine laufende Session, die erneuert werden
// muesste. Welche Rechte der ausgestellte Token traegt, entscheidet
// ausschliesslich die normale RBAC-Rollenzuweisung des Benutzers (siehe
// token.service.ts) - ein Mitarbeiter, der NUR stempeln koennen soll, bekommt
// vom Administrator schlicht nur die Rolle 'aussendienst' zugewiesen, kein
// Sondermechanismus noetig.
@Injectable()
export class KioskAuthService {
  constructor(
    @InjectRepository(Benutzer) private readonly benutzerRepo: Repository<Benutzer>,
    private readonly passwortService: PasswortService,
    private readonly tokenService: TokenService,
    private readonly kioskGeraetService: KioskGeraetService,
  ) {}

  async identifizieren(dto: KioskIdentifizierenDto): Promise<{ accessToken: string; vorname: string | null; nachname: string | null }> {
    const geraetGueltig = await this.kioskGeraetService.geraetGueltig(dto.geraeteApiKey);
    if (!geraetGueltig) {
      throw new UnauthorizedException('Geraet oder PIN ungueltig.');
    }

    const benutzer = await this.benutzerRepo.findOne({
      where: { personalnummer: dto.personalnummer },
      relations: ['rollen', 'rollen.berechtigungen'],
    });

    // Dieselbe bewusste Ununterscheidbarkeit wie beim normalen Login
    // (auth.service.ts) - "Personalnummer existiert nicht", "kein PIN gesetzt"
    // und "PIN falsch" ergeben alle dieselbe Fehlermeldung.
    if (!benutzer || !benutzer.aktiv || !benutzer.pinHash) {
      throw new UnauthorizedException('Geraet oder PIN ungueltig.');
    }
    const pinOk = await this.passwortService.verify(benutzer.pinHash, dto.pin);
    if (!pinOk) {
      throw new UnauthorizedException('Geraet oder PIN ungueltig.');
    }

    return {
      accessToken: this.tokenService.ausstellenAccessToken(benutzer),
      vorname: benutzer.vorname,
      nachname: benutzer.nachname,
    };
  }
}
