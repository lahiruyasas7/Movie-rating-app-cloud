import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'User' })
export class UserEntity {
  @PrimaryColumn('uuid', {
    default: () => 'gen_random_uuid()',
  })
  userId: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column()
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  profileImageUrl: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  dateOfBirth: string;

  @Column({ nullable: true }) // New: For Google OAuth users
  googleId: string;

  @Column({ default: 'credentials' }) // New: "credentials" | "google" | ...
  provider: string;
}
