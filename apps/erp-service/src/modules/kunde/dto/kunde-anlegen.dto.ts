import { Type } from 'class-transformer';
import { IsArray, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';

class AdresseDto {
  @IsIn(['rechnung', 'lieferung', 'baustelle', 'sonstige'])
  typ: 'rechnung' | 'lieferung' | 'baustelle' | 'sonstige';

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

export class KundeAnlegenDto {
  @IsIn(['firma', 'privatperson'])
  typ: 'firma' | 'privatperson';

  @IsOptional()
  @IsString()
  firmenname?: string;

  @IsOptional()
  @IsString()
  vorname?: string;

  @IsOptional()
  @IsString()
  nachname?: string;

  @IsOptional()
  @IsString()
  ustIdnr?: string;

  // Steuert spaeter (Belegkette, Phase 3, noch nicht gebaut) welche
  // Artikel-Uebersetzung auf Belegen an diesen Kunden gezogen wird - siehe
  // artikel_uebersetzung, Migration 0008. Default 'de' kommt aus der
  // Spalten-Definition (kunde.entity.ts), hier optional ueberschreibbar.
  @IsOptional()
  @IsString()
  sprache?: string;

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
