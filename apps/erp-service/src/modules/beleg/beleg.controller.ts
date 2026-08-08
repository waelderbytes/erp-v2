import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth';
import { Berechtigung, RbacGuard } from '../../common/rbac';
import { BelegService } from './beleg.service';
import { BelegAnlegenDto } from './dto/beleg-anlegen.dto';
import { BelegUebernehmenDto } from './dto/beleg-uebernehmen.dto';

// modul_key 'verkauf' (neu, analog 'einkauf' fuer das Bestellwesen) - deckt
// die gesamte Belegkette ab (Angebot/Auftragsbestaetigung/Lieferschein/
// Rechnung teilen sich bewusst EINEN Key, keine vier einzelnen, da sie
// fachlich ein zusammenhaengender Prozess sind).
//
// Routing: 'beleg/:id'-Unterrouten VOR ':typ' moeglich, weil sie ein
// zusaetzliches Pfadsegment haben und dadurch nie mit /belege/:typ
// kollidieren (gleiches Prinzip wie 'ermitteln' vor ':artikelId' in
// preisfindung.controller.ts).
@Controller('belege')
@UseGuards(JwtAuthGuard, RbacGuard)
export class BelegController {
  constructor(private readonly belegService: BelegService) {}

  @Get('beleg/:id')
  @Berechtigung('verkauf', 'lesen')
  find(@Param('id') id: string) {
    return this.belegService.find(id);
  }

  @Get(':typ')
  @Berechtigung('verkauf', 'lesen')
  liste(@Param('typ') typ: string) {
    return this.belegService.liste(typ);
  }

  @Post(':typ')
  @Berechtigung('verkauf', 'schreiben')
  anlegen(@Param('typ') typ: string, @Body() dto: BelegAnlegenDto) {
    return this.belegService.anlegen(typ, dto);
  }

  @Post('beleg/:id/uebernehmen')
  @Berechtigung('verkauf', 'schreiben')
  uebernehmen(@Param('id') id: string, @Body() dto: BelegUebernehmenDto, @Req() req: any) {
    return this.belegService.uebernehmen(id, dto, req.user.sub);
  }

  @Post('beleg/:id/stornieren')
  @Berechtigung('verkauf', 'schreiben')
  stornieren(@Param('id') id: string) {
    return this.belegService.stornieren(id);
  }

  @Post('beleg/:id/festschreiben')
  @Berechtigung('verkauf', 'schreiben')
  festschreiben(@Param('id') id: string) {
    return this.belegService.festschreiben(id);
  }
}
