import { ArrayMinSize, IsArray, IsIn, IsNumberString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class BelegZusatzbelegPositionDto {
  @IsUUID()
  positionId: string;

  // Anders als bei BelegUebernehmenDto KEINE Restmengen-Pruefung gegen
  // bereits weitergefuehrte Menge - Zusatzbelege sind unverbindliche/
  // ergaenzende Kopien und lesen nur die urspruenglich bestellte Menge der
  // Position (siehe beleg.service.ts::zusatzbeleg()).
  @IsNumberString()
  menge: string;
}

export class BelegZusatzbelegDto {
  @IsIn(['proforma', 'abschlag'])
  zielTyp: 'proforma' | 'abschlag';

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BelegZusatzbelegPositionDto)
  positionen: BelegZusatzbelegPositionDto[];
}
