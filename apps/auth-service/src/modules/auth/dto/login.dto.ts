import { IsEmail, IsString } from 'class-validator';

// WICHTIG: bewusst KEIN @MinLength() hier - Laengen-/Komplexitaetsregeln gelten
// nur beim ANLEGEN/AENDERN eines Passworts (siehe BootstrapDto), nicht beim
// Login. Sonst koennte sich ein Benutzer mit einem kuerzeren (z.B. per direktem
// DB-Update gesetzten Test-)Passwort nie mehr einloggen, obwohl der Hash exakt
// passt - Fehler wuerde faelschlich schon an der Validierung scheitern, bevor
// ueberhaupt gegen den Hash geprueft wird (beobachtet 08.08.2026).
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  passwort: string;
}
