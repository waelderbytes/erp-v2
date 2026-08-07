import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BERECHTIGUNG_KEY, BenoetigteBerechtigung } from './berechtigung.decorator';
import { SYSTEM_ROLLEN } from './system-rollen.const';
import { AuthenticatedUser } from '../auth/jwt.strategy';

// Erwartet einen vorgelagerten JwtAuthGuard (siehe ../auth/jwt-auth.guard.ts), der
// request.user mit AuthenticatedUser befuellt hat.
//
// Owner/Administrator: immer alles erlaubt (siehe docs/rbac-rollenkatalog.md
// Abschnitt 2), keine explizite rolle_berechtigung-Pflege fuer diese zwei Rollen.
//
// Alle anderen Rollen: Abgleich gegen request.user.berechtigungen - diese Liste wird
// beim Login/Refresh im Auth-Service aus rolle.berechtigungen (DB) berechnet und ins
// JWT gepackt (siehe apps/auth-service token.service.ts). Kein DB-Roundtrip pro
// Request noetig, dafuer gilt: Rollen-/Berechtigungsaenderungen wirken erst nach
// erneutem Login/Token-Refresh (bewusster Tradeoff, kurze Access-Token-TTL macht das
// akzeptabel, siehe .env.example JWT_ACCESS_TTL).
@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const benoetigt = this.reflector.get<BenoetigteBerechtigung | undefined>(
      BERECHTIGUNG_KEY,
      context.getHandler(),
    );
    if (!benoetigt) {
      return true; // kein @Berechtigung(...)-Decorator gesetzt -> keine RBAC-Pruefung
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;
    if (!user) {
      // Sollte nicht passieren, wenn JwtAuthGuard vorgeschaltet ist - sicherer Default.
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
