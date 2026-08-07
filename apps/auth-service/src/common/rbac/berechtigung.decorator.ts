import { SetMetadata } from '@nestjs/common';
import { BerechtigungsAktion } from './system-rollen.const';

export const BERECHTIGUNG_KEY = 'benoetigte_berechtigung';

export interface BenoetigteBerechtigung {
  modulKey: string;
  aktion: BerechtigungsAktion;
}

export const Berechtigung = (modulKey: string, aktion: BerechtigungsAktion) =>
  SetMetadata(BERECHTIGUNG_KEY, { modulKey, aktion } as BenoetigteBerechtigung);
