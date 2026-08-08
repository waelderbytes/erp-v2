import { ArrayMinSize, IsArray, IsDateString, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BelegPositionEingabeDto } from './beleg-position-eingabe.dto';

export class BelegAnlegenDto {
  @IsUUID()
  kundeId: string;

  @IsOptional()
  @IsDateString()
  belegdatum?: string;

  @IsOptional()
  @IsString()
  kommentar?: string;

  // Nur relevant, wenn direkt ein Lieferschein angelegt wird (ohne Umweg
  // ueber Angebot/Auftragsbestaetigung) - steuert, von welchem Lager der
  // Warenausgang gebucht wird. Fehlt es, wird das Standardlager verwendet
  // (siehe beleg.service.ts).
  @IsOptional()
  @IsUUID()
  lagerId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BelegPositionEingabeDto)
  positionen: BelegPositionEingabeDto[];
}
