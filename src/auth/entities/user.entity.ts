import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'User' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  userId: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ nullable: false })
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
}