import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth';
import { Berechtigung, RbacGuard } from '../../common/rbac';
import { LieferantService } from './lieferant.service';
import { LieferantAnlegenDto } from './dto/lieferant-anlegen.dto';

@Controller('lieferanten')
@UseGuards(JwtAuthGuard, RbacGuard)
export class LieferantController {
  constructor(private readonly lieferantService: LieferantService) {}

  @Get()
  @Berechtigung('lieferanten', 'lesen')
  liste() {
    return this.lieferantService.liste();
  }

  @Get(':id')
  @Berechtigung('lieferanten', 'lesen')
  find(@Param('id') id: string) {
    return this.lieferantService.find(id);
  }

  @Post()
  @Berechtigung('lieferanten', 'schreiben')
  anlegen(@Body() dto: LieferantAnlegenDto) {
    return this.lieferantService.anlegen(dto);
  }
}
