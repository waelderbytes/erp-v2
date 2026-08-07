import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth';
import { Berechtigung, RbacGuard } from '../../common/rbac';
import { KundeService } from './kunde.service';
import { KundeAnlegenDto } from './dto/kunde-anlegen.dto';
import { KundeBewertenDto } from './dto/kunde-bewerten.dto';

@Controller('kunden')
@UseGuards(JwtAuthGuard, RbacGuard)
export class KundeController {
  constructor(private readonly kundeService: KundeService) {}

  @Get()
  @Berechtigung('kunden', 'lesen')
  liste() {
    return this.kundeService.liste();
  }

  @Get(':id')
  @Berechtigung('kunden', 'lesen')
  find(@Param('id') id: string) {
    return this.kundeService.find(id);
  }

  @Post()
  @Berechtigung('kunden', 'schreiben')
  anlegen(@Body() dto: KundeAnlegenDto) {
    return this.kundeService.anlegen(dto);
  }

  @Get(':id/bewertungen')
  @Berechtigung('kunden', 'lesen')
  bewertungen(@Param('id') id: string) {
    return this.kundeService.bewertungen(id);
  }

  @Post(':id/bewertungen')
  @Berechtigung('kunden', 'schreiben')
  bewerten(@Param('id') id: string, @Body() dto: KundeBewertenDto, @Req() req: any) {
    return this.kundeService.bewerten(id, dto, req.user.sub);
  }
}
