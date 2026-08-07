import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BERECHTIGUNG_KEY, BenoetigteBerechtigung } from './berechtigung.decorator';
import { SYSTEM_ROLLEN } from './system-rollen.const';
import { AuthenticatedUser } from '../auth/jwt.strategy';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const benoetigt = this.reflector.get<BenoetigteBerechtigung | undefined>(
      BERECHTIGUNG_KEY,
      context.getHandler(),
    );
    if (!benoetigt) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;
    if (!user) {
      throw new UnauthorizedException('Kein authentifizierter Benutzer.');
    }

    if (user.rollen.includes(SYSTEM_ROLLEN.OWNER) || user.rollen.includes(SYSTEM_ROLLEN.ADMINISTRATOR)) {
      return true;
    }

    const benoetigterSchluessel = `${benoetigt.modulKey}:${benoetigt.aktion}`;
    if (user.berechtigungen.includes(benoetigterSchluessel)) {
      return true;
    }

    throw new ForbiddenException(`Keine Berechtigung fuer ${benoetigterSchluessel}.`);
  }
}
