import { IsBoolean, IsNumberString, IsOptional, IsString, MaxLength } from 'class-validator';

export class SteuersatzAnlegenDto {
  @IsString()
  @MaxLength(50)
  bezeichnung: string;

  // numeric als String uebergeben (Praezision), gleiches Muster wie ueberall
  // sonst im Projekt.
  @IsNumberString()
  satz: string;

  @IsOptional()
  @IsBoolean()
  istStandard?: boolean;
}
