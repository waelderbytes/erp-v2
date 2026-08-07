import { IsString, MinLength } from 'class-validator';

// Administrator setzt ein neues Passwort fuer einen Benutzer (z.B. nach
// "Passwort vergessen"-Anfrage per Telefon/E-Mail an den Admin - ein echter
// Self-Service-Reset-Flow per E-Mail-Link ist noch nicht gebaut, siehe
// module-uebersicht.md).
export class PasswortSetzenDto {
  @IsString()
  @MinLength(8)
  neuesPasswort: string;
}
