// Siehe docs/rbac-rollenkatalog.md Abschnitt 2 - hier nur die Bezeichner, die
// eigentlichen Berechtigungs-Zuordnungen kommen mit der ersten echten Migration.
export const SYSTEM_ROLLEN = {
  OWNER: 'owner',
  ADMINISTRATOR: 'administrator',
  SACHBEARBEITER: 'sachbearbeiter',
  LESEND: 'lesend',
  AUSSENDIENST: 'aussendienst',
} as const;

export type SystemRolle = (typeof SYSTEM_ROLLEN)[keyof typeof SYSTEM_ROLLEN];

// modul_key + aktion - siehe docs/rbac-rollenkatalog.md Abschnitt 1.
export const BERECHTIGUNGS_AKTIONEN = ['lesen', 'schreiben', 'loeschen', 'administrieren'] as const;
export type BerechtigungsAktion = (typeof BERECHTIGUNGS_AKTIONEN)[number];
