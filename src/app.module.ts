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
import { minutes, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    AuthModule,
    AppConfigModule,
    DatabaseModule,
    ChatModule,
    ConfigModule.forRoot({
      load: [appConfig],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default', // If name is not provided, the name is given as default
        ttl: minutes(1), // Time window in minutes
        limit: 10, // Number of allowed requests in that window
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService, {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },],
})
export class AppModule {}
