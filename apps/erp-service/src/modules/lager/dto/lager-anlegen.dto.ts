import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class LagerAnlegenDto {
  @IsString()
  bezeichnung: string;

  @IsOptional()
  @IsBoolean()
  istStandard?: boolean;
}
