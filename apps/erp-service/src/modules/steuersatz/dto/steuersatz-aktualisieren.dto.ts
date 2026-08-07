import { IsBoolean, IsNumberString, IsOptional, IsString, MaxLength } from 'class-validator';

export class SteuersatzAktualisierenDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  bezeichnung?: string;

  @IsOptional()
  @IsNumberString()
  satz?: string;

  @IsOptional()
  @IsBoolean()
  aktiv?: boolean;

  @IsOptional()
  @IsBoolean()
  istStandard?: boolean;
}
