import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth';
import { Berechtigung, RbacGuard } from '../../common/rbac';
import { FirmaService } from './firma.service';
import { FirmaAktualisierenDto } from './dto/firma-aktualisieren.dto';
import { ArtikelnummernSchemaSetzenDto } from './dto/artikelnummern-schema-setzen.dto';
import { ArtikelnummernStellenSetzenDto } from './dto/artikelnummern-stellen-setzen.dto';

// modul_key 'stammdaten', siehe Kommentar in steuersatz.controller.ts.
@Controller('firma')
@UseGuards(JwtAuthGuard, RbacGuard)
export class FirmaController {
  constructor(private readonly firmaService: FirmaService) {}

  @Get()
  @Berechtigung('stammdaten', 'lesen')
  lesen() {
    return this.firmaService.getOrCreate();
  }

  @Patch()
  @Berechtigung('stammdaten', 'schreiben')
  aktualisieren(@Body() dto: FirmaAktualisierenDto) {
    return this.firmaService.aktualisieren(dto);
  }

  @Post('artikelnummern-schema')
  @Berechtigung('stammdaten', 'schreiben')
  artikelnummernSchemaSetzen(@Body() dto: ArtikelnummernSchemaSetzenDto) {
    return this.firmaService.setArtikelnummernSchema(dto.schema);
  }

  @Patch('artikelnummern-stellen')
  @Berechtigung('stammdaten', 'schreiben')
  artikelnummernStellenSetzen(@Body() dto: ArtikelnummernStellenSetzenDto) {
    return this.firmaService.setArtikelnummernStellen(dto.stellen);
  }
}
