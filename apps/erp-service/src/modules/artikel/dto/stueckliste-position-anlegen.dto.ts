import { IsInt, IsNumberString, IsOptional, IsUUID } from 'class-validator';

export class StecklistePositionAnlegenDto {
  @IsUUID()
  positionArtikelId: string;

  // String statt number, gleiches Muster wie andere Mengenfelder im Projekt
  // (numeric-Spalten kommen als String aus/in TypeORM, siehe z.B.
  // Bestellposition/Lagerbewegung).
  @IsNumberString()
  menge: string;

  @IsOptional()
  @IsInt()
  sortierung?: number;
}
