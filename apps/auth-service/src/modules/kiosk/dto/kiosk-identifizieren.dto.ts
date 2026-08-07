import { IsString } from 'class-validator';

export class KioskIdentifizierenDto {
  @IsString()
  geraeteApiKey: string;

  @IsString()
  personalnummer: string;

  @IsString()
  pin: string;
}
