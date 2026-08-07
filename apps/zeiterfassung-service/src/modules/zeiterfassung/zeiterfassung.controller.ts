import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth';
import { Berechtigung, RbacGuard } from '../../common/rbac';
import { ZeiterfassungService } from './zeiterfassung.service';
import { StempelnDto } from './dto/stempeln.dto';

@Controller('zeitbuchung')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ZeiterfassungController {
  constructor(private readonly zeiterfassungService: ZeiterfassungService) {}

  // 'schreiben' reicht hier aus (nicht 'lesen') - wer stempeln darf, darf
  // zwangslaeufig auch seinen EIGENEN aktuellen Status/heutige Buchungen sehen,
  // das ist Teil desselben Vorgangs. 'lesen' ist fuer die Sicht auf ANDERE
  // Mitarbeiter reserviert (siehe /alle unten).
  @Post('stempeln')
  @Berechtigung('zeiterfassung', 'schreiben')
  stempeln(@Body() dto: StempelnDto, @Req() req: any) {
    return this.zeiterfassungService.stempeln(req.user.sub, dto);
  }

  @Get('status')
  @Berechtigung('zeiterfassung', 'schreiben')
  status(@Req() req: any) {
    return this.zeiterfassungService.aktuellerStatus(req.user.sub);
  }

  @Get('heute')
  @Berechtigung('zeiterfassung', 'schreiben')
  heute(@Req() req: any) {
    return this.zeiterfassungService.arbeitszeitHeute(req.user.sub);
  }

  // Uebersicht ueber ALLE Mitarbeiter - erfordert 'lesen', nicht nur 'schreiben'
  // (siehe rbac-rollenkatalog.md: aussendienst bekommt bewusst kein 'lesen').
  @Get('alle')
  @Berechtigung('zeiterfassung', 'lesen')
  alle(@Query('benutzerId') benutzerId?: string) {
    return this.zeiterfassungService.alleBuchungen(benutzerId);
  }
}
