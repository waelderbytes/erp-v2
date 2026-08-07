import { IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';

// Legt eine n:m-Zuordnung Artikel<->Lieferant an (siehe docs/feldkatalog.md
// Abschnitt 1.4). Erst nachdem eine Zuordnung existiert, ergibt der
// Favoriten-Endpoint (POST /artikel/:id/lieferant/:zuordnungId/favorit) Sinn -
// vorher gibt es schlicht keine Zeile, die favorisiert werden koennte.
export class ArtikelLieferantZuordnenDto {
  @IsUUID()
  lieferantId: string;

  @IsOptional()
  @IsString()
  lieferantenArtikelnummer?: string;

  // Als String statt number, damit keine Fliesskomma-Rundungsfehler beim
  // Transport entstehen - Persistierung erfolgt als numeric(12,2).
  @IsOptional()
  @IsNumberString()
  einkaufspreis?: string;

  @IsOptional()
  lieferzeitTage?: number;
}
