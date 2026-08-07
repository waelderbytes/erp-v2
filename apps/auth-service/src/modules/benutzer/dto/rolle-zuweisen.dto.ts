import { IsUUID } from 'class-validator';

export class RolleZuweisenDto {
  @IsUUID()
  rolleId: string;
}
