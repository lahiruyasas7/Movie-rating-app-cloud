import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { swaggerConfig } from './swagger.config';

export const buildSwagger = (app) => {
  const config = new DocumentBuilder()
    .setTitle('react movie rating app')
    .setDescription('The documentation about lahiru movie rating app')
    .setVersion('1.0')
    .setContact('lahiru', '#', 'lahiruyasas7@gmail.com')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  return SwaggerModule.createDocument(app, config);
};

export const setupSwagger = (app) => {
  const document = buildSwagger(app);
  SwaggerModule.setup('docs', app, document, swaggerConfig);
};
