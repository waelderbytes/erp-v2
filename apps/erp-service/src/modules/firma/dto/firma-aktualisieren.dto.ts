import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

// PATCH-Semantik - nur mitgeschickte Felder werden geaendert (siehe
// firma.service.ts aktualisieren()). Bewusst OHNE artikelnummernSchema/
// artikelnummernStellen hier - die haben eigene Endpoints mit eigener
// Sperr-Logik (siehe firma.controller.ts).
export class FirmaAktualisierenDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  strasse?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  plz?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ort?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  land?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  ustIdNr?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  steuernummer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  telefon?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsBoolean()
  kleinunternehmer?: boolean;
}
