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
import { BullModule } from '@nestjs/bullmq';

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
    BullModule.forRoot({
      connection: { host: 'localhost', port: 6379 },
      defaultJobOptions: { attempts: 3 },
    }),
    BullModule.registerQueue({ name: 'video' }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
