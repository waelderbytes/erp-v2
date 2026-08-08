import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class ArtikelkategorieAktualisierenDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  code?: string;

  // Deaktivieren statt Loeschen (gleiches Muster wie Einheit/Steuersatz) -
  // bereits vergebene Artikelnummern bleiben so nachvollziehbar gueltig,
  // die Kategorie steht nur bei NEUEN Artikeln nicht mehr zur Auswahl.
  @IsOptional()
  @IsBoolean()
  aktiv?: boolean;
}
