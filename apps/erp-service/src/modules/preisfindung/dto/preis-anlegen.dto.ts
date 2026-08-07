import { IsDateString, IsInt, IsNumberString, IsOptional, IsUUID } from 'class-validator';

export class PreisAnlegenDto {
  @IsUUID()
  artikelId: string;

  @IsOptional()
  @IsUUID()
  kundeId?: string;

  @IsOptional()
  @IsNumberString()
  staffelAbMenge?: string;

  @IsNumberString()
  preisNetto: string;

  @IsOptional()
  @IsDateString()
  gueltigVon?: string;

  @IsOptional()
  @IsDateString()
  gueltigBis?: string;

  @IsOptional()
  @IsInt()
  prioritaet?: number;
}
