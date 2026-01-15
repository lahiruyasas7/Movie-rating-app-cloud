import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'Sample' })
export class SampleEntity {
  @PrimaryColumn('uuid', {
      default: () => 'gen_random_uuid()',
    })
    id: string;

  @Column(Entity)
  sample: string;
}