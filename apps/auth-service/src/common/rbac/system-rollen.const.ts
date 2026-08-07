// Dupliziert aus apps/auth-service/src/modules/rollen (kein Cross-App-Import in Nx
// ohne Build-Setup) - siehe docs/rbac-rollenkatalog.md Abschnitt 2.
export const SYSTEM_ROLLEN = {
  OWNER: 'owner',
  ADMINISTRATOR: 'administrator',
  SACHBEARBEITER: 'sachbearbeiter',
  LESEND: 'lesend',
  AUSSENDIENST: 'aussendienst',
} as const;

export type SystemRolle = (typeof SYSTEM_ROLLEN)[keyof typeof SYSTEM_ROLLEN];
export type BerechtigungsAktion = 'lesen' | 'schreiben' | 'loeschen' | 'administrieren';
