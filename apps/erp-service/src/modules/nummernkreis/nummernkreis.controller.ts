import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth';
import { Berechtigung, RbacGuard } from '../../common/rbac';
import { NummernkreisService } from './nummernkreis.service';
import { NummernkreisAktualisierenDto } from './dto/nummernkreis-aktualisieren.dto';

// modul_key 'stammdaten', siehe Kommentar in steuersatz.controller.ts.
@Controller('nummernkreise')
@UseGuards(JwtAuthGuard, RbacGuard)
export class NummernkreisController {
  constructor(private readonly nummernkreisService: NummernkreisService) {}

  @Get()
  @Berechtigung('stammdaten', 'lesen')
  liste() {
    return this.nummernkreisService.liste();
  }

  @Patch(':entityKey')
  @Berechtigung('stammdaten', 'schreiben')
  aktualisieren(@Param('entityKey') entityKey: string, @Body() dto: NummernkreisAktualisierenDto) {
    return this.nummernkreisService.aktualisieren(entityKey, dto);
  }
}
