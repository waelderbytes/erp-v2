import { IsIn } from 'class-validator';

export class ArtikelnummernSchemaSetzenDto {
  @IsIn(['einfach', 'kategorie'])
  schema: 'einfach' | 'kategorie';
}
