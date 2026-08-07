import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth';
import { Berechtigung, RbacGuard } from '../../common/rbac';
import { EinheitService } from './einheit.service';
import { EinheitAnlegenDto } from './dto/einheit-anlegen.dto';

// modul_key bewusst 'artikelstamm' (nicht ein eigenes 'stammdaten'), da
// Einheiten aktuell ausschliesslich im Artikel-Kontext verwendet werden und
// das eigenstaendige Modul "Stammdaten/System-Einstellungen" noch nicht
// existiert (siehe module-uebersicht.md). Bei Bedarf spaeter auf einen
// eigenen modul_key umziehen, sobald dieses Modul gebaut wird.
@Controller('einheiten')
@UseGuards(JwtAuthGuard, RbacGuard)
export class EinheitController {
  constructor(private readonly einheitService: EinheitService) {}

  @Get()
  @Berechtigung('artikelstamm', 'lesen')
  liste() {
    return this.einheitService.liste();
  }

  @Post()
  @Berechtigung('artikelstamm', 'schreiben')
  anlegen(@Body() dto: EinheitAnlegenDto) {
    return this.einheitService.anlegen(dto);
  }

  // Explizit 204, siehe Kommentar in artikel.controller.ts - @Delete() ohne
  // @HttpCode() liefert sonst 200 mit leerem Body, was der Frontend-Client
  // (lib/api.ts) faelschlich als JSON-Parse-Fehler behandelt.
  @Delete(':id')
  @HttpCode(204)
  @Berechtigung('artikelstamm', 'schreiben')
  deaktivieren(@Param('id') id: string) {
    return this.einheitService.deaktivieren(id);
  }
}
