import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth';
import { Berechtigung, RbacGuard } from '../../common/rbac';
import { LagerService } from './lager.service';
import { LagerAnlegenDto } from './dto/lager-anlegen.dto';

@Controller('lager')
@UseGuards(JwtAuthGuard, RbacGuard)
export class LagerController {
  constructor(private readonly lagerService: LagerService) {}

  @Get()
  @Berechtigung('lager', 'lesen')
  liste() {
    return this.lagerService.liste();
  }

  @Post()
  @Berechtigung('lager', 'administrieren')
  anlegen(@Body() dto: LagerAnlegenDto) {
    return this.lagerService.anlegen(dto);
  }

  // Wichtig: literale Route VOR der ':id/bestand'-Route deklarieren, sonst wuerde
  // Nest 'artikel' als Wert fuer ':id' interpretieren (Routing-Matching in
  // Deklarationsreihenfolge).
  @Get('artikel/:artikelId/bestand')
  @Berechtigung('lager', 'lesen')
  bestandJeArtikel(@Param('artikelId') artikelId: string) {
    return this.lagerService.bestandJeArtikel(artikelId);
  }

  @Get(':id/bestand')
  @Berechtigung('lager', 'lesen')
  bestand(@Param('id') id: string) {
    return this.lagerService.bestandJeLager(id);
  }
}
