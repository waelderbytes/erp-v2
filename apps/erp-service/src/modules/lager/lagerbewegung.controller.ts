import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth';
import { Berechtigung, RbacGuard } from '../../common/rbac';
import { LagerbewegungService } from './lagerbewegung.service';
import { WareneingangDto } from './dto/wareneingang.dto';
import { WarenausgangDto } from './dto/warenausgang.dto';
import { UmbuchungDto } from './dto/umbuchung.dto';
import { InventurDto } from './dto/inventur.dto';

@Controller('lagerbewegung')
@UseGuards(JwtAuthGuard, RbacGuard)
export class LagerbewegungController {
  constructor(private readonly lagerbewegungService: LagerbewegungService) {}

  @Post('wareneingang')
  @Berechtigung('lager', 'schreiben')
  wareneingang(@Body() dto: WareneingangDto, @Req() req: any) {
    return this.lagerbewegungService.wareneingang(dto, req.user.sub);
  }

  @Post('warenausgang')
  @Berechtigung('lager', 'schreiben')
  warenausgang(@Body() dto: WarenausgangDto, @Req() req: any) {
    return this.lagerbewegungService.warenausgang(dto, req.user.sub);
  }

  @Post('umbuchung')
  @Berechtigung('lager', 'schreiben')
  umbuchung(@Body() dto: UmbuchungDto, @Req() req: any) {
    return this.lagerbewegungService.umbuchung(dto, req.user.sub);
  }

  @Post('inventur')
  @Berechtigung('lager', 'administrieren')
  inventur(@Body() dto: InventurDto, @Req() req: any) {
    return this.lagerbewegungService.inventur(dto, req.user.sub);
  }
}
