import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsNumberString, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

class BestellpositionAnlegenDto {
  @IsUUID()
  artikelId: string;

  @IsNumberString()
  menge: string;

  @IsOptional()
  @IsNumberString()
  einzelpreis?: string;
}

export class BestellungAnlegenDto {
  @IsUUID()
  lieferantId: string;

  @IsOptional()
  @IsDateString()
  erwartetesLieferdatum?: string;

  @IsOptional()
  @IsString()
  kommentar?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BestellpositionAnlegenDto)
  positionen: BestellpositionAnlegenDto[];
}
