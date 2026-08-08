import { ArrayMinSize, IsArray, IsNumberString, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class BelegUebernehmenPositionDto {
  @IsUUID()
  positionId: string;

  // Teilmenge, die in den neuen Beleg uebernommen werden soll - muss <= der
  // noch offenen Restmenge dieser Position sein (siehe beleg.service.ts).
  @IsNumberString()
  menge: string;
}

export class BelegUebernehmenDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BelegUebernehmenPositionDto)
  positionen: BelegUebernehmenPositionDto[];

  // Nur relevant, wenn der Zieltyp 'lieferschein' ist (siehe
  // BelegAnlegenDto.lagerId).
  @IsOptional()
  @IsUUID()
  lagerId?: string;
}
