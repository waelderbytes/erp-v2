import { Type } from 'class-transformer';
import { IsArray, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';

class AdresseDto {
  @IsIn(['rechnung', 'versand_von', 'werk', 'sonstige'])
  typ: 'rechnung' | 'versand_von' | 'werk' | 'sonstige';

  @IsOptional()
  istStandard?: boolean;

  @IsString()
  strasse: string;

  @IsString()
  plz: string;

  @IsString()
  ort: string;

  @IsOptional()
  @IsString()
  land?: string;

  @IsOptional()
  @IsString()
  zusatz?: string;
}

class KontaktDto {
  @IsString()
  vorname: string;

  @IsString()
  nachname: string;

  @IsOptional()
  @IsString()
  funktion?: string;

  @IsOptional()
  @IsString()
  telefon?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  istHauptkontakt?: boolean;
}

export class LieferantAnlegenDto {
  @IsString()
  firmenname: string;

  @IsOptional()
  @IsString()
  ustIdnr?: string;

  @IsOptional()
  @IsString()
  iban?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdresseDto)
  adressen?: AdresseDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KontaktDto)
  kontakte?: KontaktDto[];
}
