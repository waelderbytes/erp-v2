// Bekannte Entitaeten + Default-Label, siehe docs/architecture.md Abschnitt 6
// ("Idempotentes Anlegen"). Beleg-Typen kommen spaeter dazu (Modul Belegkette).
export const NUMMERNKREIS_DEFAULT_LABELS: Record<string, string> = {
  artikel: 'Artikel',
  kunden: 'Kunden',
  lieferanten: 'Lieferanten',
  bestellungen: 'Bestellungen',
};
