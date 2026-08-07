import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BERECHTIGUNG_KEY, BenoetigteBerechtigung } from './berechtigung.decorator';
import { SYSTEM_ROLLEN } from './system-rollen.const';

// Erwartet, dass ein vorgelagerter JWT-Guard bereits `request.user` mit den
// Rollen-Namen aus dem Access-Token befuellt hat (siehe apps/auth-service
// TokenService.payloadFuer -> rollen: string[]).
//
// Owner und Administrator werden bewusst als "hat immer alles" behandelt (siehe
// docs/rbac-rollenkatalog.md Abschnitt 2) - keine explizite rolle_berechtigung-
// Verknuepfung fuer diese zwei Rollen noetig/gepflegt.
//
// Fuer alle anderen Rollen fehlt hier noch der echte DB-Abgleich gegen
// rolle_berechtigung (modul_key/aktion) - das kommt mit dem ersten Modul, das
// tatsaechlich modul_key-Werte definiert (z.B. Artikelstamm). Bis dahin gilt: jede
// Nicht-Owner/Administrator-Rolle wird ohne hinterlegte Berechtigung abgelehnt,
// nicht implizit durchgelassen (sicherer Default: deny statt allow).
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
    const rollen: string[] = request.user?.rollen ?? [];

    if (rollen.includes(SYSTEM_ROLLEN.OWNER) || rollen.includes(SYSTEM_ROLLEN.ADMINISTRATOR)) {
      return true;
    }

    // TODO (naechstes Modul): echten Abgleich gegen rolle_berechtigung einbauen,
    // sobald ein Modul echte modul_key/aktion-Kombinationen definiert.
    throw new ForbiddenException(
      `Keine Berechtigung fuer ${benoetigt.modulKey}:${benoetigt.aktion}.`,
    );
  }
}
