import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ArtikelkategorieTyp } from '../../../database/entities/artikelkategorie.entity';

// Nutzerforderung 08.08.2026 (Kundendemo): kategoriebasierte Artikelnummern
// (Ober-/Untergruppe) muessen end-to-end funktionieren - bisher gab es nur
// die Entitaeten + die Nummernvergabe (artikel-nummer.service.ts), aber
// keinen Endpoint, um Haupt-/Untergruppen ueberhaupt anzulegen.
export class ArtikelkategorieAnlegenDto {
  @IsIn(['haupt', 'unter'])
  typ: ArtikelkategorieTyp;

  @IsString()
  @MaxLength(100)
  name: string;

  // Ohne Code faellt die Nummernvergabe fuer diese Kategorie automatisch auf
  // das einfache Schema zurueck (siehe KategorieOhneCodeError in
  // artikel-nummer.service.ts) - Code ist daher optional, aber praktisch
  // Pflicht, wenn das Schema 'kategorie' sinnvoll genutzt werden soll.
  @IsOptional()
  @IsString()
  @MaxLength(10)
  code?: string;
}
