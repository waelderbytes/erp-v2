import { IsEmail, IsString, MinLength } from 'class-validator';

// Legt den ersten Benutzer (Owner) einer frischen Tenant-DB an. Funktioniert nur,
// solange noch KEIN Benutzer existiert (siehe auth.service.ts bootstrap()) - danach
// ausschliesslich ueber die normale Benutzerverwaltung (Administrator/Owner legt an).
export class BootstrapDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  passwort: string;

  @IsString()
  vorname: string;

  @IsString()
  nachname: string;
}
