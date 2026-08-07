import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Vorgelagerter Guard: prueft nur "ist der Token gueltig", KEINE Rechte-Pruefung.
// Rechte-Pruefung ist Aufgabe von RbacGuard (siehe ../rbac/rbac.guard.ts), der auf
// request.user (von hier befuellt) aufbaut. Reihenfolge in @UseGuards(...) ist daher
// wichtig: erst JwtAuthGuard, dann RbacGuard.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
