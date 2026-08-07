import { IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';

export class WareneingangBuchenDto {
  @IsUUID()
  positionId: string;

  @IsUUID()
  lagerId: string;

  @IsNumberString()
  menge: string;

  @IsOptional()
  @IsString()
  kommentar?: string;
}
