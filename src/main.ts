import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';
import { UserPojo } from '@common/interfaces/user.interface.js';
import { UserContext } from '@common/context/user-context.js';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: true
    }),
  );

  // CORS
  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    credentials: true,
  });

  // hook fastify
  const fastifyInstance = app.getHttpAdapter().getInstance();

  // hook for debug query before validate
  // fastifyInstance.addHook('preValidation', (request: any, reply: any, done: any) => {
  //   console.log('[FASTIFY HOOK DEBUG] Query Before Validate:', request.query);
  //   console.log('[FASTIFY HOOK DEBUG] Body Before Validate:', request.body);
  //   done();
  // });

  // hook for inject userContext and access in subscriber or interceptor
  fastifyInstance.addHook('preHandler', (req, reply, done) => {
    const user = (req as any).user as UserPojo;
    if (user) {
      UserContext.run(user, () => done());
    } else {
      done();
    }
  });

  const prefix = process.env.API_PREFIX;
  if (prefix && prefix.trim() !== '') {
    app.setGlobalPrefix(prefix);
  }

  /**
   * ignore property not in DTO
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 8080);
  await app.listen(port, '0.0.0.0');
}
await bootstrap();

