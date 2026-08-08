// Zentrale Konstanten fuer die Belegkette (Modul Verkauf) - vermeidet
// verstreute Magic Strings in Liste/Detail-Komponenten. belegTyp-Werte
// muessen exakt zu apps/erp-service/.../beleg.entity.ts passen.
import { BelegStatus, BelegTyp } from './types';

export const BELEG_TYP_LABEL: Record<BelegTyp, string> = {
  angebot: 'Angebot',
  auftragsbestaetigung: 'Auftragsbestätigung',
  lieferschein: 'Lieferschein',
  rechnung: 'Rechnung',
};

export const BELEG_TYP_LABEL_PLURAL: Record<BelegTyp, string> = {
  angebot: 'Angebote',
  auftragsbestaetigung: 'Aufträge',
  lieferschein: 'Lieferscheine',
  rechnung: 'Rechnungen',
};

// URL-Pfadsegment je Typ (Routen in App.tsx).
export const BELEG_TYP_PFAD: Record<BelegTyp, string> = {
  angebot: 'angebote',
  auftragsbestaetigung: 'auftraege',
  lieferschein: 'lieferscheine',
  rechnung: 'rechnungen',
};

// Muss zu BELEG_KETTE in beleg.service.ts (Backend) passen.
export const BELEG_NACHFOLGER: Record<BelegTyp, BelegTyp | null> = {
  angebot: 'auftragsbestaetigung',
  auftragsbestaetigung: 'lieferschein',
  lieferschein: 'rechnung',
  rechnung: null,
};

export const BELEG_STATUS_LABEL: Record<BelegStatus, string> = {
  offen: 'Offen',
  teilweise_weitergefuehrt: 'Teilweise weitergeführt',
  abgeschlossen: 'Abgeschlossen',
  storniert: 'Storniert',
};
