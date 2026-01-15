import 'dotenv/config';
import 'reflect-metadata';
import { ChatEntity } from '../../entities/chat.entity';
import { SampleEntity } from '../../entities/sample.entity';
import { UserEntity } from '../../entities/user.entity';
import { Video } from '../../entities/video.entity';
import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
//   host: process.env.DATABASE_URL ? undefined : process.env.DATABASE_HOST,
//   port: process.env.DATABASE_URL
//     ? undefined
//     : Number(process.env.DATABASE_PORT),
//   username: process.env.DATABASE_USERNAME,
//   password: process.env.DATABASE_PASSWORD,
//   database: process.env.DATABASE_NAME,
  synchronize: false, // ALWAYS false for CLI
  logging: true,
  entities: [UserEntity, SampleEntity, Video, ChatEntity],
  migrations: ['src/migrations/*.{ts,js}'],
  //ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  //ssl: { rejectUnauthorized: false },
});
