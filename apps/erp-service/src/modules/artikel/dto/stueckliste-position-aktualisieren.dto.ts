import { IsNumberString, IsOptional, IsInt } from 'class-validator';

export class StecklistePositionAktualisierenDto {
  @IsOptional()
  @IsNumberString()
  menge?: string;

  @IsOptional()
  @IsInt()
  sortierung?: number;
}
