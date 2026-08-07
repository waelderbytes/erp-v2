import { IsBoolean, IsOptional, IsString } from 'class-validator';

// Bewusst KEIN email-Feld - E-Mail-Aenderung ist ein sensiblerer Vorgang
// (betrifft Login-Identitaet), fuer die erste Version der Benutzerverwaltung
// noch nicht vorgesehen (siehe module-uebersicht.md, noch offen).
export class BenutzerAktualisierenDto {
  @IsOptional()
  @IsString()
  vorname?: string;

  @IsOptional()
  @IsString()
  nachname?: string;

  @IsOptional()
  @IsBoolean()
  aktiv?: boolean;

  @IsOptional()
  @IsString()
  personalnummer?: string;

  @IsOptional()
  @IsString()
  rfidUid?: string;
}
