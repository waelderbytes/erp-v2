import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Benutzer } from '../../database/entities/benutzer.entity';

export interface JwtPayload {
  sub: string; // benutzer.id
  email: string;
  rollen: string[]; // Rollen-Namen, siehe docs/rbac-rollenkatalog.md - fuer den RBAC-Guard
  // ohne DB-Roundtrip pro Request. Bei Rollenaenderung muss der Benutzer sich neu
  // einloggen bzw. Refresh-Token holen (Token-TTL bewusst kurz, siehe .env.example).
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private payloadFuer(benutzer: Benutzer): JwtPayload {
    return {
      sub: benutzer.id,
      email: benutzer.email,
      rollen: (benutzer.rollen ?? []).map((r) => r.name),
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
