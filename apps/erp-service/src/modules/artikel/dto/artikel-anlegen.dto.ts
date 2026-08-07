import { IsBoolean, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class ArtikelAnlegenDto {
  @IsIn(['handelsware', 'dienstleistung', 'fertigungsartikel'])
  artikelart: 'handelsware' | 'dienstleistung' | 'fertigungsartikel';

  @IsString()
  bezeichnung: string;

  @IsOptional()
  @IsString()
  beschreibung?: string;

  // Nur relevant wenn firma.artikelnummern_schema == 'kategorie' - siehe
  // artikel.service.ts fuer die Verzweigung.
  @IsOptional()
  @IsUUID()
  hauptgruppeId?: string;

  @IsOptional()
  @IsUUID()
  untergruppeId?: string;

  @IsOptional()
  @IsBoolean()
  bestandsgefuehrt?: boolean;

  @IsOptional()
  @IsString()
  einheit?: string;

  @IsOptional()
  @IsString()
  eanGtin?: string;

  @IsOptional()
  @IsString()
  hersteller?: string;

  @IsOptional()
  @IsString()
  herstellerArtikelnummer?: string;
}
