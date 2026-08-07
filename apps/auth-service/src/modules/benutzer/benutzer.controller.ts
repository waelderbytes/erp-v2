import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth';
import { Berechtigung, RbacGuard } from '../../common/rbac';
import { BenutzerService } from './benutzer.service';
import { BenutzerAnlegenDto } from './dto/benutzer-anlegen.dto';
import { BenutzerAktualisierenDto } from './dto/benutzer-aktualisieren.dto';
import { PasswortSetzenDto } from './dto/passwort-setzen.dto';
import { PinSetzenDto } from './dto/pin-setzen.dto';
import { RolleZuweisenDto } from './dto/rolle-zuweisen.dto';

// Alle Endpoints an modul_key 'benutzerverwaltung' gebunden. Per Design ist das
// exklusiv fuer Owner/Administrator gedacht (siehe docs/rbac-rollenkatalog.md) -
// diese beiden passieren den RbacGuard ohnehin per Rollen-Bypass (siehe
// common/rbac/rbac.guard.ts). Keine der Standard-Rollen (sachbearbeiter, lesend,
// aussendienst) bekommt in Migration 0003 eine Verknuepfung zu diesem modul_key.
// 'schreiben' fuer normale Profil-Aenderungen, 'administrieren' fuer die
// sensibleren Aktionen (Passwort/PIN setzen, Rollen zuweisen/entziehen).
@Controller('benutzer')
@UseGuards(JwtAuthGuard, RbacGuard)
export class BenutzerController {
  constructor(private readonly benutzerService: BenutzerService) {}

  @Post()
  @Berechtigung('benutzerverwaltung', 'schreiben')
  anlegen(@Body() dto: BenutzerAnlegenDto) {
    return this.benutzerService.anlegen(dto);
  }

  @Get()
  @Berechtigung('benutzerverwaltung', 'lesen')
  liste() {
    return this.benutzerService.liste();
  }

  @Get(':id')
  @Berechtigung('benutzerverwaltung', 'lesen')
  finden(@Param('id') id: string) {
    return this.benutzerService.finden(id);
  }

  @Patch(':id')
  @Berechtigung('benutzerverwaltung', 'schreiben')
  aktualisieren(@Param('id') id: string, @Body() dto: BenutzerAktualisierenDto) {
    return this.benutzerService.aktualisieren(id, dto);
  }

  @Post(':id/passwort')
  @Berechtigung('benutzerverwaltung', 'administrieren')
  passwortSetzen(@Param('id') id: string, @Body() dto: PasswortSetzenDto) {
    return this.benutzerService.passwortSetzen(id, dto);
  }

  @Post(':id/pin')
  @Berechtigung('benutzerverwaltung', 'administrieren')
  pinSetzen(@Param('id') id: string, @Body() dto: PinSetzenDto) {
    return this.benutzerService.pinSetzen(id, dto);
  }

  @Post(':id/rollen')
  @Berechtigung('benutzerverwaltung', 'administrieren')
  rolleZuweisen(@Param('id') id: string, @Body() dto: RolleZuweisenDto) {
    return this.benutzerService.rolleZuweisen(id, dto);
  }

  @Delete(':id/rollen/:rolleId')
  @Berechtigung('benutzerverwaltung', 'administrieren')
  rolleEntziehen(@Param('id') id: string, @Param('rolleId') rolleId: string) {
    return this.benutzerService.rolleEntziehen(id, rolleId);
  }
}
