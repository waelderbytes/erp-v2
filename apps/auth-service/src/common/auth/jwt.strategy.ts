// Gemeinsame JWT-Strategie fuer alle Services - validiert Access-Token gegen
// JWT_ACCESS_SECRET (siehe .env.example) und befuellt request.user mit dem Payload
// aus token.service.ts payloadFuer(). Kein zentraler IdP-Call noetig, jeder Service
// prueft die Signatur selbst (siehe docs/architecture.md Abschnitt 1).
// Dupliziert aus apps/erp-service/src/common/auth (kein Cross-App-Import in Nx ohne
// Build-Setup, siehe dortiger Kommentar) - wird mit Umstieg auf echten Nx-Build
// konsolidiert.
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface AuthenticatedUser {
  sub: string;
  email: string;
  rollen: string[];
  berechtigungen: string[];
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

  validate(payload: AuthenticatedUser): AuthenticatedUser {
    return payload;
  }
}
