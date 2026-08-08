import * as React from 'react';
import { cn } from '@/lib/utils';

// Duenner farbiger Top-Akzent (border-t-2 border-t-primary) statt eines
// dickeren umlaufenden Rahmens - Anlehnung an die vom Nutzer gewuenschte
// "gerahmte Formularabschnitte"-Optik (Referenzbilder 08.08.2026), aber
// zurueckhaltender, da Card auch fuer Listen-/Dialog-Wrapper genutzt wird.
// Bewusst KEINE Farbaenderung - nutzt weiterhin nur die bestehende
// --primary-Variable, kein neuer Farbwert.
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-lg border border-border border-t-2 border-t-primary bg-card text-card-foreground shadow-sm', className)}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />,
);
CardHeader.displayName = 'CardHeader';

// Kleine Uppercase-Eyebrow-Ueberschrift statt grossem h3 - Anlehnung an die
// "BEZEICHNUNGEN"/"KLASSIFIZIERUNG"-Abschnittsheader aus den Referenzbildern.
// CardTitle wird im Projekt ausschliesslich als Karten-interner Abschnitts-
// header verwendet (nie als grosse Seitenueberschrift - die nutzen ein
// eigenes <h1>), daher ueberall sicher austauschbar.
export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-xs font-semibold uppercase tracking-wide text-primary', className)} {...props} />
  ),
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />,
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />,
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />,
);
CardFooter.displayName = 'CardFooter';
