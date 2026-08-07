import { IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';

export class WarenausgangDto {
  @IsUUID()
  artikelId: string;

  @IsUUID()
  lagerId: string;

  @IsNumberString()
  menge: string;

  @IsOptional()
  @IsString()
  kommentar?: string;
}
