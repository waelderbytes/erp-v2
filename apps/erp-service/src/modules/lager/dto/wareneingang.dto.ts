import { IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';

export class WareneingangDto {
  @IsUUID()
  artikelId: string;

  @IsUUID()
  lagerId: string;

  // Als String (nicht number), damit keine Fliesskomma-Rundungsfehler beim
  // Transport entstehen - Persistierung erfolgt als numeric(14,3).
  @IsNumberString()
  menge: string;

  @IsOptional()
  @IsString()
  kommentar?: string;
}
