import { NestFactory } from '@nestjs/core'; //Used to create the main NestJS application instance.
import { AppModule } from './app.module'; //The root module of your app. Nest starts by loading this.
import { ValidationPipe } from '@nestjs/common'; //Adds automatic request validation using decorators like @IsString() from class-validator.
import { ConfigService } from '@nestjs/config'; //Provides access to .env values like app.port.
import { setupSwagger } from './configs/swager-config/swagger';
import * as bodyParser from 'body-parser'; //Middleware to parse request bodies (JSON, URL-encoded) and cookies, respectively.
import * as cookieParser from 'cookie-parser'; //Middleware to parse request bodies (JSON, URL-encoded) and cookies, respectively.
import * as dotenv from 'dotenv';
dotenv.config();
async function bootstrap() {
  const app = await NestFactory.create(AppModule); //Initializes the NestJS app using the root module.
  app.setGlobalPrefix(process.env.API_PREFIX, {
    exclude: ['/'], //Adds a prefix like /api to all routes except /, which remains unprefixed. Great for versioning.
  });
  app.useGlobalPipes(new ValidationPipe()); //Ensures that incoming requests conform to your DTO validation rules.
  const configService = app.get(ConfigService); //Fetches config settings like port, API keys, DB credentials from .env.
  //cors configuration
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow non-browser requests like Postman
      const frontendUrl = process.env.FRONTEND_URL;
      if (frontendUrl && origin === frontendUrl) {
        callback(null, true); // allow this origin
      } else {
        callback(new Error(`CORS not allowed for origin: ${origin}`)); // block any other origin
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], // allowed HTTP methods
    credentials: true, // allow cookies and Authorization headers
  });

  // Setup Swagger
  setupSwagger(app);
  app.use(bodyParser.json({ limit: '5000mb' }));
  app.use(bodyParser.urlencoded({ limit: '5000mb', extended: true }));
  app.use(cookieParser()); //Parses cookies in incoming requests. Useful for sessions/authentication.
  await app.listen(configService.get('app.port'), () => {
    console.log(`Server running at port: ${configService.get('app.port')}`);
  });
}
bootstrap();
