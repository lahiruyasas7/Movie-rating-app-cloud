import { Module } from '@nestjs/common';
import { AuthService, JWTAuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GoogleStrategy } from './strategies/google.strategy';
import { MulterModule } from '@nestjs/platform-express';
import { UploadService } from 'src/util/uploadTos3.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService], // Inject ConfigService
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('app.jwtSecret'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
    TypeOrmModule.forFeature([UserEntity]),
    MulterModule.register({}),
    //ConfigModule.forRoot(),
  ],
  controllers: [AuthController],
  providers: [AuthService, JWTAuthService, GoogleStrategy, UploadService],
})
export class AuthModule {}
