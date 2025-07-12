import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { AppConfigModule } from './configs/app-configs/app.config.module';
import { DatabaseModule } from './configs/database-config/database.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [AuthModule, AppConfigModule, DatabaseModule, ChatModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
