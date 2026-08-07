import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class KundeBewertenDto {
  @IsUUID()
  kriteriumId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  sterne: number;

  @IsOptional()
  @IsString()
  kommentar?: string;
}
