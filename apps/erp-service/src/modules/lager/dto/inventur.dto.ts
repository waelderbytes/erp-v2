import { IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';

export class InventurDto {
  @IsUUID()
  artikelId: string;

  @IsUUID()
  lagerId: string;

  // Der GEZAEHLTE Bestand, nicht das Delta - der Service berechnet das Delta
  // selbst (neuerBestand - aktueller Bestand) und bucht genau diese Differenz.
  @IsNumberString()
  neuerBestand: string;

  @IsOptional()
  @IsString()
  kommentar?: string;
}
