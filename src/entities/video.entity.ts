import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed';

@Entity('videos')
export class Video {
  @PrimaryColumn('uuid', {
    default: () => 'gen_random_uuid()',
  })
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true })
  s3Key: string; // e.g. user-videos/uuid.mp4

  @Column()
  s3Url: string;

  @Column({ default: 'pending' })
  status: VideoStatus;

  @Column({ nullable: true, type: 'text' })
  errorMessage: string; // populated when status = 'failed'

  @Column({ default: 0 })
  retryCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  userId: string;
}
