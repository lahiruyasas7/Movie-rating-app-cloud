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
import { VideoModule } from './videos/videos.module';

@Module({
  imports: [
    AuthModule,
    AppConfigModule,
    DatabaseModule,
    ChatModule,
    VideoModule,
    ConfigModule.forRoot({
      load: [appConfig],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default', // If name is not provided, the name is given as default
        ttl: minutes(1), // Time window in minutes
        limit: 100, // Number of allowed requests in that window
      },
    ]),
    // BullModule.forRoot({
    //   connection: { host: 'localhost', port: 6379 },
    //   // defaultJobOptions: {
    //   //   attempts: 3, // Max number of attempts for failed jobs
    //   //   removeOnFail: 3000, // Keep data for the last 3000 failed jobs
    //   //   removeOnComplete: 1000, // Keep data for the last 1000 completed jobs
    //   //   backoff: 2000, // Wait at least 2 seconds before attempting the job again, after failure
    //   // },
    // }),
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
