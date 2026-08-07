import { IsIn, IsLatitude, IsLongitude, IsOptional, IsString } from 'class-validator';
import { ZeitbuchungQuelle, ZeitbuchungTyp } from '../../../database/entities/zeitbuchung.entity';

export class StempelnDto {
  @IsIn(['kommt', 'geht', 'pause_beginn', 'pause_ende'])
  typ: ZeitbuchungTyp;

  // Rein informativ/fuer Reporting, keine Sicherheitsgrenze - Frontend (PWA)
  // sendet 'web', Kiosk-Tablet-UI sendet 'kiosk'.
  @IsIn(['web', 'kiosk'])
  quelle: ZeitbuchungQuelle;

  // Nur relevant fuer Buchungen vom eigenen Geraet (PWA) - Kiosk-Buchungen lassen
  // das weg, siehe Entity-Kommentar.
  @IsOptional()
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @IsLongitude()
  lng?: number;

  @IsOptional()
  @IsString()
  kommentar?: string;
}
