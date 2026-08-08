import { IsNumberString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

// Pflichtfelder haengen davon ab, ob artikelId gesetzt ist - das laesst sich mit
// class-validator allein nicht sauber ausdruecken (kein @ValidateIf auf Basis
// eines Geschwisterfelds ohne Zusatzaufwand), deshalb wird das im Service
// (beleg.service.ts::loesePositionAuf) geprueft, nicht hier im DTO.
export class BelegPositionEingabeDto {
  @IsOptional()
  @IsUUID()
  artikelId?: string;

  // Pflicht, wenn kein artikelId angegeben ist (Freitext-Position) - sonst
  // optional, Default kommt vom Artikel.
  @IsOptional()
  @IsString()
  @MaxLength(200)
  bezeichnung?: string;

  @IsNumberString()
  menge: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  einheitCode?: string;

  // Optional - wenn nicht gesetzt UND artikelId vorhanden, wird ueber die
  // bestehende Preisfindung (preisfindung.service.ts) ermittelt. Ohne
  // artikelId ist einzelpreis Pflicht (siehe Service).
  @IsOptional()
  @IsNumberString()
  einzelpreis?: string;

  // Optional - wenn nicht gesetzt UND artikelId vorhanden, wird der
  // Steuersatz vom Artikel uebernommen (artikel.steuersatzId ist seit
  // Migration 0015 Pflicht). Ohne artikelId ist steuersatzId Pflicht.
  @IsOptional()
  @IsUUID()
  steuersatzId?: string;
}
