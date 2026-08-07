import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

// PATCH-Semantik. startValue wird nur uebernommen, wenn der Nummernkreis noch
// unbenutzt ist (siehe nummernkreis.service.ts aktualisieren() und
// architecture.md Abschnitt 6) - sonst wuerden bereits vergebene Nummern
// erneut vergeben werden koennen.
export class NummernkreisAktualisierenDto {
  @IsOptional()
  @IsString()
  @MaxLength(10)
  prefix?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(15)
  stellen?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  startValue?: number;
}
