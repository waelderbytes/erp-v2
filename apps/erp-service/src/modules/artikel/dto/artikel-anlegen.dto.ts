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
  @IsUUID()
  einheitId?: string;

  @IsOptional()
  @IsString()
  eanGtin?: string;

  @IsOptional()
  @IsString()
  hersteller?: string;

  @IsOptional()
  @IsString()
  herstellerArtikelnummer?: string;

  // Rein intern, siehe Migration 0008 / artikel.entity.ts Kommentar. Bewusst
  // einsprachig - keine Uebersetzung noetig.
  @IsOptional()
  @IsString()
  interneNotiz?: string;
}
