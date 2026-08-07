import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth';
import { Berechtigung, RbacGuard } from '../../common/rbac';
import { PreisfindungService } from './preisfindung.service';
import { PreisAnlegenDto } from './dto/preis-anlegen.dto';
import { PreisErmittelnQueryDto } from './dto/preis-ermitteln-query.dto';

@Controller('preise')
@UseGuards(JwtAuthGuard, RbacGuard)
export class PreisfindungController {
  constructor(private readonly preisfindungService: PreisfindungService) {}

  @Post()
  @Berechtigung('preisfindung', 'schreiben')
  anlegen(@Body() dto: PreisAnlegenDto) {
    return this.preisfindungService.anlegen(dto);
  }

  // Literale Route VOR ':artikelId', gleiches Muster wie schon bei
  // lager.controller.ts ('artikel/:artikelId/bestand' vor ':id/bestand').
  @Get('ermitteln')
  @Berechtigung('preisfindung', 'lesen')
  ermitteln(@Query() query: PreisErmittelnQueryDto) {
    return this.preisfindungService.ermitteln(query);
  }

  @Get('artikel/:artikelId')
  @Berechtigung('preisfindung', 'lesen')
  listeJeArtikel(@Param('artikelId') artikelId: string) {
    return this.preisfindungService.listeJeArtikel(artikelId);
  }
}
