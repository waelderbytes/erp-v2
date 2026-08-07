import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth';
import { Berechtigung, RbacGuard } from '../../common/rbac';
import { SteuersatzService } from './steuersatz.service';
import { SteuersatzAnlegenDto } from './dto/steuersatz-anlegen.dto';
import { SteuersatzAktualisierenDto } from './dto/steuersatz-aktualisieren.dto';

// modul_key 'stammdaten' - neuer, eigener Schluessel fuer das Modul
// Stammdaten/System-Einstellungen (siehe docs/rbac-rollenkatalog.md).
// Anders als bei Einheiten (modul_key 'artikelstamm', pragmatisch
// mitgenutzt) bekommt dieses Modul einen eigenen Key, weil es bewusst nicht
// jeder Sachbearbeiter-Rolle offenstehen soll - ohne explizite Vergabe
// greift automatisch nur der Owner/Administrator-Bypass in RbacGuard.
@Controller('steuersaetze')
@UseGuards(JwtAuthGuard, RbacGuard)
export class SteuersatzController {
  constructor(private readonly steuersatzService: SteuersatzService) {}

  @Get()
  @Berechtigung('stammdaten', 'lesen')
  liste() {
    return this.steuersatzService.liste();
  }

  @Post()
  @Berechtigung('stammdaten', 'schreiben')
  anlegen(@Body() dto: SteuersatzAnlegenDto) {
    return this.steuersatzService.anlegen(dto);
  }

  @Patch(':id')
  @Berechtigung('stammdaten', 'schreiben')
  aktualisieren(@Param('id') id: string, @Body() dto: SteuersatzAktualisierenDto) {
    return this.steuersatzService.aktualisieren(id, dto);
  }
}
