// Zentrale Typdefinitionen, gespiegelt gegen die erp-service-Entities (siehe
// apps/erp-service/src/database/entities/*). Bewusst als reine Interfaces ohne
// Codegenerierung aus dem Backend (OpenAPI-Client-Generierung ist ein spaeterer
// Ausbauschritt, siehe docs/architecture.md) - MVP haelt beide Seiten manuell
// synchron, Feldnamen 1:1 wie in den DTOs/Entities.
export type Artikelart = 'handelsware' | 'dienstleistung' | 'fertigungsartikel';

export interface Artikel {
  id: string;
  artikelnummer: string;
  artikelart: Artikelart;
  bezeichnung: string;
  beschreibung: string | null;
  einheit: string | null;
  eanGtin: string | null;
  hersteller: string | null;
  herstellerArtikelnummer: string | null;
  aktiv: boolean;
  bestandsgefuehrt: boolean;
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
