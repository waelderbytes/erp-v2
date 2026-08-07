import { SetMetadata } from '@nestjs/common';
import { BerechtigungsAktion } from './system-rollen.const';

export const BERECHTIGUNG_KEY = 'benoetigte_berechtigung';

export interface BenoetigteBerechtigung {
  modulKey: string;
  aktion: BerechtigungsAktion;
}

// Decorator fuer Controller-Methoden: @Berechtigung('artikelstamm', 'schreiben')
// Siehe docs/rbac-rollenkatalog.md Abschnitt 1 (Durchsetzung).
export const Berechtigung = (modulKey: string, aktion: BerechtigungsAktion) =>
  SetMetadata(BERECHTIGUNG_KEY, { modulKey, aktion } as BenoetigteBerechtigung);
