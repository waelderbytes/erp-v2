// Zentrale Typdefinitionen, gespiegelt gegen die erp-service-Entities (siehe
// apps/erp-service/src/database/entities/*). Bewusst als reine Interfaces ohne
// Codegenerierung aus dem Backend (OpenAPI-Client-Generierung ist ein spaeterer
// Ausbauschritt, siehe docs/architecture.md) - MVP haelt beide Seiten manuell
// synchron, Feldnamen 1:1 wie in den DTOs/Entities.
export type Artikelart = 'handelsware' | 'dienstleistung' | 'fertigungsartikel';

export interface Einheit {
  id: string;
  code: string;
  name: string;
  aktiv: boolean;
  dezimalstellen: number;
}

export interface Steuersatz {
  id: string;
  bezeichnung: string;
  satz: string;
  aktiv: boolean;
  istStandard: boolean;
}

export interface Firma {
  id: number;
  artikelnummernSchema: 'einfach' | 'kategorie';
  artikelnummernStellen: number;
  name: string | null;
  strasse: string | null;
  plz: string | null;
  ort: string | null;
  land: string;
  ustIdNr: string | null;
  steuernummer: string | null;
  telefon: string | null;
  email: string | null;
  kleinunternehmer: boolean;
}

export interface Nummernkreis {
  id: string;
  entityKey: string;
  label: string;
  prefix: string;
  startValue: number;
  nextValue: number;
  stellen: number;
}

export interface Artikel {
  id: string;
  artikelnummer: string;
  artikelart: Artikelart;
  bezeichnung: string;
  beschreibung: string | null;
  einheitId: string | null;
  // Nur gesetzt, wenn das Backend die Relation mitlaedt (liste()/find() ja,
  // anlegen()/aktualisieren() nicht - siehe artikel.service.ts). Frontend
  // sollte primaer einheitId nutzen, einheit nur fuer Anzeige-Komfort.
  einheit?: Einheit;
  steuersatzId: string;
  // Analog einheit - nur gesetzt, wenn die Relation mitgeladen wurde.
  steuersatz?: Steuersatz;
  eanGtin: string | null;
  hersteller: string | null;
  herstellerArtikelnummer: string | null;
  interneNotiz: string | null;
  aktiv: boolean;
  bestandsgefuehrt: boolean;
  bomfaehig: boolean;
  gewichtKg: string | null;
  laengeMm: string | null;
  breiteMm: string | null;
  hoeheMm: string | null;
  mindestbestand: string | null;
}

export type BelegTyp = 'angebot' | 'auftragsbestaetigung' | 'lieferschein' | 'rechnung';
export type BelegStatus = 'offen' | 'teilweise_weitergefuehrt' | 'abgeschlossen' | 'storniert';

export interface BelegPosition {
  id: string;
  belegId: string;
  positionNr: number;
  artikelId: string | null;
  artikel?: Artikel;
  bezeichnung: string;
  menge: string;
  weitergefuehrteMenge: string;
  einheitCode: string | null;
  einzelpreis: string;
  steuersatzId: string | null;
  steuersatz?: Steuersatz;
  steuersatzProzent: string;
  referenzPositionId: string | null;
}

export interface Beleg {
  id: string;
  belegTyp: BelegTyp;
  belegnummer: string;
  kundeId: string;
  kunde?: Kunde;
  status: BelegStatus;
  belegdatum: string;
  referenzBelegId: string | null;
  referenzBeleg?: Beleg;
  festgeschrieben: boolean;
  kommentar: string | null;
  positionen?: BelegPosition[];
}

export interface ArtikelUebersetzung {
  id: string;
  artikelId: string;
  sprache: string;
  kurztext: string | null;
  langtext: string | null;
}

export interface KundeAdresse {
  typ: string;
  strasse: string;
  plz: string;
  ort: string;
  land?: string;
}

export interface Kunde {
  id: string;
  kundennummer: string;
  typ: 'firma' | 'privatperson';
  firmenname: string | null;
  vorname: string | null;
  nachname: string | null;
  // Steuert spaeter (Belegkette, Phase 3) welche Artikel-Uebersetzung auf
  // Belegen an diesen Kunden gezogen wird, siehe ArtikelUebersetzung. Default 'de'.
  sprache: string;
  aktiv: boolean;
  adressen?: KundeAdresse[];
}

export interface Lieferant {
  id: string;
  lieferantennummer: string;
  firmenname: string;
  aktiv: boolean;
}

export interface Lager {
  id: string;
  bezeichnung: string;
  istStandard: boolean;
  aktiv: boolean;
}

export interface Lagerbestand {
  id: string;
  artikelId: string;
  lagerId: string;
  menge: string;
  artikel?: Artikel;
  lager?: Lager;
}

export type LagerbewegungTyp = 'wareneingang' | 'warenausgang' | 'umbuchung' | 'inventur_korrektur';

export interface Lagerbewegung {
  id: string;
  artikelId: string;
  lagerId: string;
  lager?: Lager;
  typ: LagerbewegungTyp;
  menge: string;
  umbuchungGruppeId: string | null;
  kommentar: string | null;
  referenzTyp: string | null;
  referenzId: string | null;
  gebuchtVon: string;
  gebuchtAm: string;
}

export interface AuditLogEintrag {
  id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  changedBy: string | null;
  changedAt: string;
}

export interface ArtikelLog {
  auditLog: AuditLogEintrag[];
  lagerbewegungen: Lagerbewegung[];
}

export interface StuecklistePosition {
  id: string;
  kopfArtikelId: string;
  positionArtikelId: string;
  positionArtikel?: Artikel;
  menge: string;
  sortierung: number;
}

export interface StuecklisteKnoten {
  positionId: string | null;
  artikel: Artikel;
  menge: string;
  effektiveMenge: string;
  kinder: StuecklisteKnoten[];
}

export type BestellungStatus = 'offen' | 'bestellt' | 'teilweise_geliefert' | 'abgeschlossen' | 'storniert';

export interface Bestellposition {
  id: string;
  artikelId: string;
  menge: string;
  gelieferteMenge: string;
  einzelpreis: string | null;
  artikel?: Artikel;
}

export interface Bestellung {
  id: string;
  bestellnummer: string;
  lieferantId: string;
  status: BestellungStatus;
  bestelldatum: string;
  lieferant?: Lieferant;
  positionen?: Bestellposition[];
}

export interface Artikelpreis {
  id: string;
  artikelId: string;
  kundeId: string | null;
  staffelAbMenge: string;
  preisNetto: string;
  gueltigVon: string | null;
  gueltigBis: string | null;
  prioritaet: number;
  aktiv: boolean;
}

export type BerechtigungsAktion = 'lesen' | 'schreiben' | 'loeschen' | 'administrieren';

export interface Berechtigung {
  id: string;
  modulKey: string;
  aktion: BerechtigungsAktion;
}

export interface Rolle {
  id: string;
  name: string;
  istSystemRolle: boolean;
  beschreibung: string | null;
  berechtigungen?: Berechtigung[];
}

export interface Benutzer {
  id: string;
  email: string;
  vorname: string | null;
  nachname: string | null;
  aktiv: boolean;
  personalnummer: string | null;
  rfidUid: string | null;
  rollen: Rolle[];
  createdAt: string;
  updatedAt: string;
}

export type ZeitbuchungTyp = 'kommt' | 'geht' | 'pause_beginn' | 'pause_ende';
export type ZeitbuchungStatus = 'ausgestempelt' | 'eingestempelt' | 'pause';

export interface Zeitbuchung {
  id: string;
  benutzerId: string;
  typ: ZeitbuchungTyp;
  zeitpunkt: string;
  quelle: 'web' | 'kiosk';
  kommentar: string | null;
}

export interface ArbeitszeitHeute {
  arbeitszeitMinuten: number;
  pausenzeitMinuten: number;
  status: ZeitbuchungStatus;
}

export interface ArtikelLieferant {
  id: string;
  artikelId: string;
  lieferantId: string;
  lieferantenArtikelnummer: string | null;
  einkaufspreis: string | null;
  lieferzeitTage: number | null;
  istBevorzugt: boolean;
  lieferant?: Lieferant;
}
