import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Benutzer } from '../../database/entities/benutzer.entity';
import { Rolle } from '../../database/entities/rolle.entity';
import { PasswortService } from './passwort.service';
import { TokenService } from './token.service';
import { LoginDto } from './dto/login.dto';
import { BootstrapDto } from './dto/bootstrap.dto';
import { SYSTEM_ROLLEN } from '../rollen/system-rollen.const';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Benutzer) private readonly benutzerRepo: Repository<Benutzer>,
    @InjectRepository(Rolle) private readonly rolleRepo: Repository<Rolle>,
    private readonly passwortService: PasswortService,
    private readonly tokenService: TokenService,
  ) {}

  // Legt den allerersten Benutzer (Owner) einer frischen Tenant-DB an. Nur moeglich,
  // solange die benutzer-Tabelle leer ist - danach 409, echte Benutzerverwaltung
  // uebernimmt (Administrator/Owner legt weitere Benutzer ueber die normale Route an,
  // noch nicht implementiert). Verhindert, dass sich irgendwer nachtraeglich per
  // Bootstrap-Endpoint Owner-Rechte selbst zuweist.
  async bootstrap(dto: BootstrapDto) {
    const anzahl = await this.benutzerRepo.count();
    if (anzahl > 0) {
      throw new ConflictException(
        'Bootstrap nicht mehr moeglich - es existiert bereits mindestens ein Benutzer.',
      );
    }

    const ownerRolle = await this.rolleRepo.findOneByOrFail({ name: SYSTEM_ROLLEN.OWNER });

    const benutzer = this.benutzerRepo.create({
      email: dto.email,
      passwortHash: await this.passwortService.hash(dto.passwort),
      vorname: dto.vorname,
      nachname: dto.nachname,
      rollen: [ownerRolle],
    });
    await this.benutzerRepo.save(benutzer);

    return this.token(benutzer);
  }

  async login(dto: LoginDto) {
    const benutzer = await this.benutzerRepo.findOne({
      where: { email: dto.email },
      relations: ['rollen', 'rollen.berechtigungen'],
    });

    // Bewusst dieselbe Fehlermeldung fuer "Benutzer existiert nicht" und "Passwort
    // falsch" - verhindert User-Enumeration ueber die Fehlermeldung.
    if (!benutzer || !benutzer.aktiv) {
      throw new UnauthorizedException('E-Mail oder Passwort falsch.');
    }
    const passwortOk = await this.passwortService.verify(benutzer.passwortHash, dto.passwort);
    if (!passwortOk) {
      throw new UnauthorizedException('E-Mail oder Passwort falsch.');
    }

    return this.token(benutzer);
  }

  async refresh(refreshToken: string) {
    const payload = this.tokenService.pruefenRefreshToken(refreshToken);
    const benutzer = await this.benutzerRepo.findOne({
      where: { id: payload.sub },
      relations: ['rollen', 'rollen.berechtigungen'],
    });
    if (!benutzer || !benutzer.aktiv) {
      throw new UnauthorizedException('Ungueltiger Refresh-Token.');
    }
    return this.token(benutzer);
  }

  private token(benutzer: Benutzer) {
    return {
      accessToken: this.tokenService.ausstellenAccessToken(benutzer),
      refreshToken: this.tokenService.ausstellenRefreshToken(benutzer),
    };
  }
}
