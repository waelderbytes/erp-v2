import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth';
import { Berechtigung, RbacGuard } from '../../common/rbac';
import { ArtikelkategorieService } from './artikelkategorie.service';
import { ArtikelkategorieAnlegenDto } from './dto/artikelkategorie-anlegen.dto';
import { ArtikelkategorieAktualisierenDto } from './dto/artikelkategorie-aktualisieren.dto';

// modul_key 'stammdaten' (gleicher Key wie Firma/Steuersaetze/Nummernkreise -
// Artikel-Haupt-/Untergruppen sind fachlich Stammdaten, kein Verkaufs-Vorgang).
//
// Route 'vorschau-nummer' VOR ':id', sonst wuerde Nest sie als :id matchen
// (gleiches Prinzip wie 'beleg/:id' vor ':typ' in beleg.controller.ts).
@Controller('artikelkategorien')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ArtikelkategorieController {
  constructor(private readonly service: ArtikelkategorieService) {}

  @Get('vorschau-nummer')
  @Berechtigung('stammdaten', 'lesen')
  vorschauNummer(@Query('hauptgruppeId') hauptgruppeId: string, @Query('untergruppeId') untergruppeId: string) {
    return this.service.vorschauNummer(hauptgruppeId, untergruppeId).then((nummer) => ({ nummer }));
  }

  @Get()
  @Berechtigung('stammdaten', 'lesen')
  liste(@Query('typ') typ?: string) {
    return this.service.liste(typ);
  }

  @Post()
  @Berechtigung('stammdaten', 'schreiben')
  anlegen(@Body() dto: ArtikelkategorieAnlegenDto) {
    return this.service.anlegen(dto);
  }

  @Patch(':id')
  @Berechtigung('stammdaten', 'schreiben')
  aktualisieren(@Param('id') id: string, @Body() dto: ArtikelkategorieAktualisierenDto) {
    return this.service.aktualisieren(id, dto);
  }
}
