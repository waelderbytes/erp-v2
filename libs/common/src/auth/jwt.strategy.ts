// Gemeinsame JWT-Strategie fuer alle Services - validiert Access-Token gegen
// JWT_ACCESS_SECRET (siehe .env.example) und befuellt request.user mit dem Payload
// aus apps/auth-service TokenService.payloadFuer(). Kein zentraler IdP-Call noetig,
// jeder Service prueft die Signatur selbst (siehe docs/architecture.md Abschnitt 1).
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface AuthenticatedUser {
  sub: string;
  email: string;
  rollen: string[];
  berechtigungen: string[]; // "modulKey:aktion", siehe token.service.ts
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_ACCESS_SECRET'),
    });
  }

  // Rueckgabewert landet 1:1 in request.user (Standard-Passport-Verhalten).
  validate(payload: AuthenticatedUser): AuthenticatedUser {
    return payload;
  }
}
