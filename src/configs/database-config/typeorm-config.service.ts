import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  private getValue(key: string, throwOnMissing = true): string {
    const value = this.configService.get(key);
    if (!value && throwOnMissing) {
      throw new Error(`config error - missing env.${key}`);
    }

    return value;
  }

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: this.getValue('app.databaseType'),
      host: this.getValue('app.databaseHost'),
      port: this.getValue('app.databasePort'),
      username: this.getValue('app.databaseUserName'),
      password: this.getValue('app.databasePassword'),
      database: this.getValue('app.databaseName'),
      synchronize: true,
      dropSchema: false,
      autoLoadEntities: true,
      keepConnectionAlive: true,
      // logging: this.configService.get('app.nodeEnv') !== 'production',
      logging: true,
      entities: [__dirname + '../../*/.entity{.ts,.js}'],
      migrations: [__dirname + '/migrations/*/{.ts,.js}'],
      cli: {
        entitiesDir: 'src',
        migrationsDir: 'src/database-config/migrations',
        subscribersDir: 'subscriber',
      },
    } as TypeOrmModuleOptions;
  }
}
