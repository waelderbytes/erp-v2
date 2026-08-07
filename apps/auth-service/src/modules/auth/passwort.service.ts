// Argon2id statt bcrypt - modernerer, gegen GPU-Cracking robusterer Algorithmus,
// von OWASP fuer neue Projekte empfohlen.
import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class PasswortService {
  hash(klartext: string): Promise<string> {
    return argon2.hash(klartext, { type: argon2.argon2id });
  }

  verify(hash: string, klartext: string): Promise<boolean> {
    return argon2.verify(hash, klartext);
  }
}
