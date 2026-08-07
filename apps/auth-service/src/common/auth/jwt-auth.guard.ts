import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Vorgelagerter Guard: prueft nur "ist der Token gueltig", KEINE Rechte-Pruefung.
// Rechte-Pruefung ist Aufgabe von RbacGuard (siehe ../rbac/rbac.guard.ts).
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
