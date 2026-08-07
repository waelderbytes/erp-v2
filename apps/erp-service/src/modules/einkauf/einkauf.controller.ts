import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth';
import { Berechtigung, RbacGuard } from '../../common/rbac';
import { EinkaufService } from './einkauf.service';
import { BestellungAnlegenDto } from './dto/bestellung-anlegen.dto';
import { WareneingangBuchenDto } from './dto/wareneingang-buchen.dto';

@Controller('bestellungen')
@UseGuards(JwtAuthGuard, RbacGuard)
export class EinkaufController {
  constructor(private readonly einkaufService: EinkaufService) {}

  @Get()
  @Berechtigung('einkauf', 'lesen')
  liste() {
    return this.einkaufService.liste();
  }

  @Get(':id')
  @Berechtigung('einkauf', 'lesen')
  find(@Param('id') id: string) {
    return this.einkaufService.find(id);
  }

  @Post()
  @Berechtigung('einkauf', 'schreiben')
  anlegen(@Body() dto: BestellungAnlegenDto) {
    return this.einkaufService.anlegen(dto);
  }

  @Post(':id/bestellen')
  @Berechtigung('einkauf', 'schreiben')
  bestellen(@Param('id') id: string) {
    return this.einkaufService.bestellen(id);
  }

  @Post('wareneingang')
  @Berechtigung('einkauf', 'schreiben')
  wareneingangBuchen(@Body() dto: WareneingangBuchenDto, @Req() req: any) {
    return this.einkaufService.wareneingangBuchen(dto, req.user.sub);
  }
}
