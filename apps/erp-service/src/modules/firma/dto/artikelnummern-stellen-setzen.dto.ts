import { IsInt, Max, Min } from 'class-validator';

export class ArtikelnummernStellenSetzenDto {
  @IsInt()
  @Min(1)
  @Max(15)
  stellen: number;
}
