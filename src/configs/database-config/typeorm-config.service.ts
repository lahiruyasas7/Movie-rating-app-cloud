import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  private getValue(key: string, throwOnMissing = true): string {
    const value = this.configService.get<string>(key);
    if (!value && throwOnMissing) {
      throw new Error(`config error - missing env.${key}`);
    }
    return value;
  }

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');

    if (databaseUrl) {
      return this.createUrlBasedConfig(databaseUrl);
    }

    return this.createHostBasedConfig();
  }

  private createUrlBasedConfig(databaseUrl: string): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      url: databaseUrl,
      autoLoadEntities: true,
      synchronize: false, // REQUIRED for Supabase
      logging: true,
      ssl: {
        rejectUnauthorized: false,
      },
    };
  }

  private createHostBasedConfig(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.getValue('DATABASE_HOST'),
      port: Number(this.getValue('DATABASE_PORT')),
      username: this.getValue('DATABASE_USERNAME'),
      password: this.getValue('DATABASE_PASSWORD'),
      database: this.getValue('DATABASE_NAME'),
      autoLoadEntities: true,
      synchronize: true, // LOCAL ONLY
      logging: true,
      ssl:
        this.getValue('DATABASE_SSL_ENABLED', false) === 'true'
          ? {
              rejectUnauthorized:
                this.getValue('DATABASE_REJECT_UNAUTHORIZED', false) === 'true',
            }
          : false,
    };
  }
}
