import { IsString } from 'class-validator';

export class KioskGeraetAnlegenDto {
  @IsString()
  bezeichnung: string;
}
