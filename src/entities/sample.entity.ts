import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'Sample' })
export class SampleEntity {
  @PrimaryGeneratedColumn('uuid')
  sampleId: string;

  @Column(Entity)
  sample: string;
}