// Zentrale Konstanten fuer die Belegkette (Modul Verkauf) - vermeidet
// verstreute Magic Strings in Liste/Detail-Komponenten. belegTyp-Werte
// muessen exakt zu apps/erp-service/.../beleg.entity.ts passen.
import { BelegStatus, BelegTyp } from './types';

export const BELEG_TYP_LABEL: Record<BelegTyp, string> = {
  angebot: 'Angebot',
  auftragsbestaetigung: 'Auftragsbestätigung',
  lieferschein: 'Lieferschein',
  rechnung: 'Rechnung',
  proforma: 'Proformarechnung',
  abschlag: 'Abschlagsrechnung',
};

export const BELEG_TYP_LABEL_PLURAL: Record<BelegTyp, string> = {
  angebot: 'Angebote',
  auftragsbestaetigung: 'Aufträge',
  lieferschein: 'Lieferscheine',
  rechnung: 'Rechnungen',
  proforma: 'Proformarechnungen',
  abschlag: 'Abschlagsrechnungen',
};

// URL-Pfadsegment je Typ (Routen in App.tsx).
export const BELEG_TYP_PFAD: Record<BelegTyp, string> = {
  angebot: 'angebote',
  auftragsbestaetigung: 'auftraege',
  lieferschein: 'lieferscheine',
  rechnung: 'rechnungen',
  proforma: 'proformarechnungen',
  abschlag: 'abschlagsrechnungen',
};

// Muss zu BELEG_KETTE in beleg.service.ts (Backend) passen. 'proforma'/
// 'abschlag' haben bewusst KEINEN Nachfolger ueber "uebernehmen" - sie
// entstehen stattdessen als Zusatzbeleg aus einer Auftragsbestaetigung,
// siehe BELEG_ZUSATZ_TYPEN/ZUSATZBELEG_QUELLE_TYP unten.
export const BELEG_NACHFOLGER: Record<BelegTyp, BelegTyp | null> = {
  angebot: 'auftragsbestaetigung',
  auftragsbestaetigung: 'lieferschein',
  lieferschein: 'rechnung',
  rechnung: null,
  proforma: null,
  abschlag: null,
};

// Muss zu ZUSATZBELEG_QUELLE/ZUSATZBELEG_TYPEN in beleg.service.ts passen.
export const ZUSATZBELEG_QUELLE_TYP: BelegTyp = 'auftragsbestaetigung';
export const BELEG_ZUSATZ_TYPEN: BelegTyp[] = ['proforma', 'abschlag'];

// Muss zu FESTSCHREIBBARE_TYPEN in beleg.service.ts passen.
export const BELEG_FESTSCHREIBBAR: BelegTyp[] = ['rechnung', 'abschlag'];

export const BELEG_STATUS_LABEL: Record<BelegStatus, string> = {
  offen: 'Offen',
  teilweise_weitergefuehrt: 'Teilweise weitergeführt',
  abgeschlossen: 'Abgeschlossen',
  storniert: 'Storniert',
};
