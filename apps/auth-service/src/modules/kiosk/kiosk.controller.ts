import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth';
import { Berechtigung, RbacGuard } from '../../common/rbac';
import { KioskGeraetService } from './kiosk-geraet.service';
import { KioskAuthService } from './kiosk-auth.service';
import { KioskGeraetAnlegenDto } from './dto/kiosk-geraet-anlegen.dto';
import { KioskIdentifizierenDto } from './dto/kiosk-identifizieren.dto';

@Controller('auth/kiosk')
export class KioskController {
  constructor(
    private readonly kioskGeraetService: KioskGeraetService,
    private readonly kioskAuthService: KioskAuthService,
  ) {}

  // Oeffentlich wie /auth/login - das TABLET hat noch keinen Token, es identifiziert
  // sich gerade erst (Geraete-API-Key + Personalnummer + PIN, siehe
  // kiosk-auth.service.ts).
  @Post('identifizieren')
  identifizieren(@Body() dto: KioskIdentifizierenDto) {
    return this.kioskAuthService.identifizieren(dto);
  }

  // Geraete-Verwaltung ist an 'zeiterfassung':'administrieren' gebunden, bis es
  // eine eigene Benutzerverwaltung/System-Einstellungen gibt (siehe
  // docs/module-uebersicht.md "Stammdaten/System-Einstellungen", noch offen).
  @Get('geraete')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Berechtigung('zeiterfassung', 'administrieren')
  liste() {
    return this.kioskGeraetService.liste();
  }

  @Post('geraete')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Berechtigung('zeiterfassung', 'administrieren')
  anlegen(@Body() dto: KioskGeraetAnlegenDto) {
    return this.kioskGeraetService.anlegen(dto);
  }
}
