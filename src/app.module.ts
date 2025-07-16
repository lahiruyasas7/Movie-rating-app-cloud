import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { AppConfigModule } from './configs/app-configs/app.config.module';
import { DatabaseModule } from './configs/database-config/database.module';
import { ChatModule } from './chat/chat.module';
import appConfig from './configs/app-configs/app.config';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [AuthModule, AppConfigModule, DatabaseModule, ChatModule, ConfigModule.forRoot({
      load: [appConfig],
    }),],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
