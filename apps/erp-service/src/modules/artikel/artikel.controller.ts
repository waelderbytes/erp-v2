import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth';
import { Berechtigung, RbacGuard } from '../../common/rbac';
import { ArtikelService } from './artikel.service';
import { ArtikelAnlegenDto } from './dto/artikel-anlegen.dto';
import { ArtikelLieferantZuordnenDto } from './dto/artikel-lieferant-zuordnen.dto';
import { ArtikelAktualisierenDto } from './dto/artikel-aktualisieren.dto';
import { ArtikelUebersetzungUpsertDto } from './dto/artikel-uebersetzung-upsert.dto';

@Controller('artikel')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ArtikelController {
  constructor(private readonly artikelService: ArtikelService) {}

  @Get()
  @Berechtigung('artikelstamm', 'lesen')
  liste() {
    return this.artikelService.liste();
  }

  @Get(':id')
  @Berechtigung('artikelstamm', 'lesen')
  find(@Param('id') id: string) {
    return this.artikelService.find(id);
  }

  @Post()
  @Berechtigung('artikelstamm', 'schreiben')
  anlegen(@Body() dto: ArtikelAnlegenDto) {
    return this.artikelService.anlegen(dto);
  }

  @Patch(':id')
  @Berechtigung('artikelstamm', 'schreiben')
  aktualisieren(@Param('id') id: string, @Body() dto: ArtikelAktualisierenDto) {
    return this.artikelService.aktualisieren(id, dto);
  }

  @Post(':id/lieferant')
  @Berechtigung('artikelstamm', 'schreiben')
  lieferantZuordnen(@Param('id') id: string, @Body() dto: ArtikelLieferantZuordnenDto) {
    return this.artikelService.lieferantZuordnen(id, dto);
  }

  @Get(':id/lieferant')
  @Berechtigung('artikelstamm', 'lesen')
  lieferantenListe(@Param('id') id: string) {
    return this.artikelService.lieferantenListe(id);
  }

  @Post(':id/lieferant/:zuordnungId/favorit')
  @Berechtigung('artikelstamm', 'schreiben')
  favoritSetzen(@Param('id') id: string, @Param('zuordnungId') zuordnungId: string) {
    return this.artikelService.lieferantAlsFavoritSetzen(id, zuordnungId);
  }

  @Get(':id/uebersetzungen')
  @Berechtigung('artikelstamm', 'lesen')
  uebersetzungenListe(@Param('id') id: string) {
    return this.artikelService.uebersetzungenListe(id);
  }

  @Put(':id/uebersetzungen/:sprache')
  @Berechtigung('artikelstamm', 'schreiben')
  uebersetzungUpsert(
    @Param('id') id: string,
    @Param('sprache') sprache: string,
    @Body() dto: ArtikelUebersetzungUpsertDto,
  ) {
    return this.artikelService.uebersetzungUpsert(id, sprache, dto);
  }

  @Delete(':id/uebersetzungen/:sprache')
  @Berechtigung('artikelstamm', 'schreiben')
  uebersetzungLoeschen(@Param('id') id: string, @Param('sprache') sprache: string) {
    return this.artikelService.uebersetzungLoeschen(id, sprache);
  }
}
