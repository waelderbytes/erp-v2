import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Benutzer } from '../../database/entities/benutzer.entity';

export interface JwtPayload {
  sub: string; // benutzer.id
  email: string;
  rollen: string[]; // Rollen-Namen, siehe docs/rbac-rollenkatalog.md
  berechtigungen: string[]; // "modulKey:aktion", fuer libs/common RbacGuard - siehe
  // docs/rbac-rollenkatalog.md Abschnitt 1. Owner/Administrator brauchen hier nichts
  // (RbacGuard laesst sie ueber die Rollen-Pruefung durch), fuer alle anderen Rollen
  // ist das die tatsaechliche Grundlage der Rechtepruefung.
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private payloadFuer(benutzer: Benutzer): JwtPayload {
    const rollen = benutzer.rollen ?? [];
    const berechtigungen = rollen.flatMap((rolle) =>
      (rolle.berechtigungen ?? []).map((b) => `${b.modulKey}:${b.aktion}`),
    );
    return {
      sub: benutzer.id,
      email: benutzer.email,
      rollen: rollen.map((r) => r.name),
      berechtigungen: [...new Set(berechtigungen)],
    };
  }

  ausstellenAccessToken(benutzer: Benutzer): string {
    return this.jwt.sign(this.payloadFuer(benutzer), {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_TTL', '15m'),
    });
  }

  ausstellenRefreshToken(benutzer: Benutzer): string {
    return this.jwt.sign(this.payloadFuer(benutzer), {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_TTL', '30d'),
    });
  }

  pruefenRefreshToken(token: string): JwtPayload {
    return this.jwt.verify<JwtPayload>(token, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
    });
  }
}
