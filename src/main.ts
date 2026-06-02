import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Pecuária IA')
    .setDescription('API de gestão genética e reprodutiva para bovinos, ovinos e caprinos')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .addApiKey({ type: 'apiKey', in: 'header', name: 'X-Backoffice-Secret', description: 'Secret para rotas de backoffice' }, 'X-Backoffice-Secret')
    .addGlobalParameters({
      name: 'X-Farm-ID',
      in: 'header',
      required: false,
      schema: { type: 'string', example: 'uuid-da-fazenda' },
      description: 'ID da fazenda ativa — obrigatório em todas as rotas com FarmGuard',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Pecuária IA rodando em http://localhost:${port}`);
  console.log(`Swagger disponível em http://localhost:${port}/docs`);
}

bootstrap();
