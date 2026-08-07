import { IsArray, IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

// Legt einen neuen Benutzer an (Administrator/Owner-Funktion, siehe
// benutzer.controller.ts). Bewusst OHNE Personalnummer/PIN hier - das sind
// separate Endpoints (POST /benutzer/:id/pin), nicht jeder neue Benutzer
// braucht ueberhaupt Kiosk-Zugriff. rollenIds optional: ein frisch angelegter
// Benutzer kann ganz ohne Rolle starten (dann faktisch ohne Berechtigungen,
// bis eine Rolle zugewiesen wird - sichere Default-Haltung).
export class BenutzerAnlegenDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  passwort: string;

  @IsString()
  vorname: string;

  @IsString()
  nachname: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  rollenIds?: string[];
}
