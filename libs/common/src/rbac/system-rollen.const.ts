// Dupliziert bewusst aus apps/auth-service (kein Cross-App-Import in Nx ohne
// Build-Setup) - siehe docs/rbac-rollenkatalog.md Abschnitt 2. Wird mit dem
// Umstieg auf einen echten Nx-Build/Path-Alias konsolidiert.
export const SYSTEM_ROLLEN = {
  OWNER: 'owner',
  ADMINISTRATOR: 'administrator',
  SACHBEARBEITER: 'sachbearbeiter',
  LESEND: 'lesend',
  AUSSENDIENST: 'aussendienst',
} as const;

export type SystemRolle = (typeof SYSTEM_ROLLEN)[keyof typeof SYSTEM_ROLLEN];
export type BerechtigungsAktion = 'lesen' | 'schreiben' | 'loeschen' | 'administrieren';
