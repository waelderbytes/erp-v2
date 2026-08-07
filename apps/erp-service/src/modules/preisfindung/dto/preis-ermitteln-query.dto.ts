import { IsDateString, IsNumberString, IsOptional, IsUUID } from 'class-validator';

export class PreisErmittelnQueryDto {
  @IsUUID()
  artikelId: string;

  @IsOptional()
  @IsNumberString()
  menge?: string;

  @IsOptional()
  @IsUUID()
  kundeId?: string;

  // Erlaubt Preisermittlung "zum Stichtag" (z. B. fuer eine Nachkalkulation) statt
  // immer nur zum aktuellen Zeitpunkt - optional, Default ist heute.
  @IsOptional()
  @IsDateString()
  datum?: string;
}
