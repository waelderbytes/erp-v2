import { IsString, Matches } from 'class-validator';

// 4-stellige PIN fuer den Kiosk-Login (siehe modules/kiosk/kiosk-auth.service.ts).
// Bewusst rein numerisch und fest 4 Stellen - einfach genug fuer ein
// Wandtablet, siehe urspruengliche Anforderung in module-uebersicht.md
// "Zeiterfassung".
export class PinSetzenDto {
  @IsString()
  @Matches(/^\d{4}$/, { message: 'PIN muss aus genau 4 Ziffern bestehen.' })
  pin: string;
}
