import { IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';

export class UmbuchungDto {
  @IsUUID()
  artikelId: string;

  @IsUUID()
  vonLagerId: string;

  @IsUUID()
  nachLagerId: string;

  @IsNumberString()
  menge: string;

  @IsOptional()
  @IsString()
  kommentar?: string;
}
