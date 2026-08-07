import { Controller, Get, NotFoundException, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth';
import { Berechtigung, RbacGuard } from '../../common/rbac';
import { RollenService } from './rollen.service';

// Lesend an 'benutzerverwaltung' gebunden: wer Benutzer anlegen/bearbeiten darf,
// muss auch die verfuegbaren Rollen sehen koennen (z.B. fuer ein Dropdown im
// Frontend). Siehe benutzer.controller.ts fuer die gleiche RBAC-Logik.
@Controller('rollen')
@UseGuards(JwtAuthGuard, RbacGuard)
export class RollenController {
  constructor(private readonly rollenService: RollenService) {}

  @Get()
  @Berechtigung('benutzerverwaltung', 'lesen')
  liste() {
    return this.rollenService.liste();
  }

  @Get(':id')
  @Berechtigung('benutzerverwaltung', 'lesen')
  async finden(@Param('id') id: string) {
    const rolle = await this.rollenService.finden(id);
    if (!rolle) {
      throw new NotFoundException('Rolle nicht gefunden.');
    }
    return rolle;
  }
}
