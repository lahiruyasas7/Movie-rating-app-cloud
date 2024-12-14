import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { AppConfigModule } from './configs/app-configs/app.config.module';

@Module({
  imports: [AuthModule, AppConfigModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
