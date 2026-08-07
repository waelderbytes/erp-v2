import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class EinheitAnlegenDto {
  @IsString()
  @MaxLength(10)
  code: string;

  @IsString()
  @MaxLength(50)
  name: string;

  // Default 2 (wie in ERP v1), siehe Kommentar in einheit.entity.ts.
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dezimalstellen?: number;
}
