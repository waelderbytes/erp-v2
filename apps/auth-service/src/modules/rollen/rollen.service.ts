import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rolle } from '../../database/entities/rolle.entity';

@Injectable()
export class RollenService {
  constructor(@InjectRepository(Rolle) private readonly rolleRepo: Repository<Rolle>) {}

  // Ohne Berechtigungen geladen - reicht fuer ein Dropdown im Frontend
  // (Benutzer anlegen/Rolle zuweisen). Wer die einzelnen Berechtigungen einer
  // Rolle sehen will, nutzt GET /rollen/:id.
  liste(): Promise<Rolle[]> {
    return this.rolleRepo.find({ order: { name: 'ASC' } });
  }

  finden(id: string): Promise<Rolle | null> {
    return this.rolleRepo.findOne({ where: { id }, relations: ['berechtigungen'] });
  }
}
