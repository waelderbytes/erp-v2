import * as React from 'react';

// Zweistufiger Seitentitel (kleine Uppercase-Eyebrow + grosser fetter Titel) -
// Anlehnung an die Referenzbilder (08.08.2026, Nutzerwunsch "warum nicht
// ueberall"). Eyebrow ist meist der Navigationsgruppen-Name aus Layout.tsx
// (Warenwirtschaft/Zeiterfassung/Verwaltung), macht auf jeder Seite sichtbar,
// zu welchem Bereich sie gehoert. Keine Farbaenderung - nutzt nur die
// bestehenden --muted-foreground/--foreground-Variablen.
export function PageHeading({
  eyebrow,
  title,
  actions,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        {eyebrow && (
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{eyebrow}</div>
        )}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      </div>
      {actions}
    </div>
  );
}
