import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forRoot({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    password: 'lahiru1928',
    username: 'postgres',
    entities: [],
    database: 'movie-rating',
    synchronize: true,
    logging: true,
  }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
