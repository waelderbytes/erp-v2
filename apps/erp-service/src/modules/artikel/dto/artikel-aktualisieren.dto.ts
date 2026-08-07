import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

// Alle Felder optional - PATCH-Semantik, nur mitgeschickte Felder werden
// geaendert (siehe artikel.service.ts aktualisieren()). Bewusst OHNE
// artikelart/hauptgruppeId/untergruppeId hier: Artikelart-Wechsel nach dem
// Anlegen wuerde die Nummernkreis-/Bestandsfuehrungs-Logik verkomplizieren
// (z.B. Dienstleistung -> Handelsware macht bestandsgefuehrt wieder relevant)
// - fuer die erste Version bewusst nicht vorgesehen, kann bei Bedarf als
// eigener, expliziter "Artikelart wechseln"-Vorgang nachgezogen werden.
export class ArtikelAktualisierenDto {
  @IsOptional()
  @IsString()
  bezeichnung?: string;

  @IsOptional()
  @IsString()
  beschreibung?: string;

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

  @IsOptional()
  @IsString()
  interneNotiz?: string;

  @IsOptional()
  @IsBoolean()
  bestandsgefuehrt?: boolean;

  // Nur bei artikelart 'fertigungsartikel' wirksam (siehe artikel.service.ts).
  @IsOptional()
  @IsBoolean()
  bomfaehig?: boolean;

  @IsOptional()
  @IsBoolean()
  aktiv?: boolean;
}
