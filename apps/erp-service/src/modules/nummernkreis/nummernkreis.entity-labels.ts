// Bekannte Entitaeten + Default-Label, siehe docs/architecture.md Abschnitt 6
// ("Idempotentes Anlegen"). Belegkette-Typen seit Migration 0017 (Modul
// Belegkette/Verkauf) ergaenzt.
export const NUMMERNKREIS_DEFAULT_LABELS: Record<string, string> = {
  artikel: 'Artikel',
  kunden: 'Kunden',
  lieferanten: 'Lieferanten',
  bestellungen: 'Bestellungen',
  angebote: 'Angebote',
  auftragsbestaetigungen: 'Auftragsbestätigungen',
  lieferscheine: 'Lieferscheine',
  rechnungen: 'Rechnungen',
};
