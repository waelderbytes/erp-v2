import { IsOptional, IsString, MaxLength } from 'class-validator';

// PUT-Semantik keyed auf (artikelId, sprache aus der URL) - das Frontend
// kennt/braucht keine eigene Uebersetzungs-id, gleiches Muster wie in ERP v1
// (waelderbytes-suite, services.py upsert_artikel_uebersetzung).
export class ArtikelUebersetzungUpsertDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  kurztext?: string;

  @IsOptional()
  @IsString()
  langtext?: string;
}
