import { IsBoolean, IsIn, IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';

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

  // Nur bei artikelart 'fertigungsartikel' wirksam (siehe artikel.service.ts).
  @IsOptional()
  @IsBoolean()
  bomfaehig?: boolean;

  @IsOptional()
  @IsNumberString()
  gewichtKg?: string;

  @IsOptional()
  @IsNumberString()
  laengeMm?: string;

  @IsOptional()
  @IsNumberString()
  breiteMm?: string;

  @IsOptional()
  @IsNumberString()
  hoeheMm?: string;

  // Nur relevant wenn bestandsgefuehrt=true (siehe feldkatalog.md) - keine
  // Service-seitige Erzwingung, reine Zusatzinfo.
  @IsOptional()
  @IsNumberString()
  mindestbestand?: string;

  @IsOptional()
  @IsUUID()
  einheitId?: string;

  // Pflicht (feldkatalog.md) - anders als einheitId, das optional bleibt.
  @IsUUID()
  steuersatzId: string;

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
