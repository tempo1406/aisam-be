import 'dotenv/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as compression from 'compression';
import * as session from 'express-session';
import * as passport from 'passport';
import {
  ClassSerializerInterceptor,
  ExceptionFilter,
  Logger,
  NestInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as morgan from 'morgan';
import { ConfigService } from '@nestjs/config';
import { useContainer } from 'class-validator';
import { AllConfigType } from '@configs/config.type';
import validationOptions from '@utils/validation-option';
import { ResolvePromisesInterceptor } from '@utils/serializer.interceptor';
import { GlobalExceptionFilter } from '@common/filters/global-exception.filter';
import { DataSource } from 'typeorm';
import { configSwagger } from '@configs/swagger.config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AISAM_CALLBACK_QUEUE } from '@constants/aisam-rabbitmq.constant';

async function bootstrap() {
  const logger = new Logger('AISAM_BE');
  logger.log('Initializing AISAM_BE');
  initializeTransactionalContext();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });

  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  const dataSource = app.get(DataSource);
  await dataSource.runMigrations();

  const configService = app.get(ConfigService<AllConfigType>);
  const reflector = app.get(Reflector);

  // enable shutdown hooks to gracefully shutdown the app
  app.enableShutdownHooks();

  // only if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, ...)
  app.enable('trust proxy');

  // private headers
  app.use(helmet());

  // compression payload
  app.use(compression());

  // session for OAuth
  app.use(
    session({
      secret: process.env.JWT_SECRET || 'facebook-oauth-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 3600000, // 1 hour
        httpOnly: true,
        sameSite: 'none',
        secure: process.env.NODE_ENV === 'prod',
      },
    }),
  );

  // Initialize Passport and session support
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Passport session serialization
  passport.serializeUser((user: Express.User, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: Express.User, done) => {
    done(null, user);
  });

  // log all requests
  app.use(morgan('combined'));

  // add prefix api to all routes, ignore root route
  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
    {
      exclude: ['/'],
    },
  );

  // add versioning to all routes
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // global exception filter
  app.useGlobalFilters(
    new GlobalExceptionFilter(configService) as unknown as ExceptionFilter,
  );

  // auto validate DTO base on decorator
  app.useGlobalPipes(new ValidationPipe(validationOptions));

  const rabbitmqUrl = process.env.RABBITMQ_URL;
  if (rabbitmqUrl) {
    logger.log('Connecting to RabbitMQ for payment callbacks...');

    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [rabbitmqUrl],
        queue: AISAM_CALLBACK_QUEUE, // Queue riêng cho AISAM_BE
        queueOptions: {
          durable: true,
          arguments: {
            'x-message-ttl': 30000, // Sync with Payment Service config
          },
        },
        prefetchCount: 1,
        noAck: false,
      },
    });

    await app.startAllMicroservices();
    logger.log('RabbitMQ listener started');
  }

  // resolve promises in responses
  app.useGlobalInterceptors(
    // ResolvePromisesInterceptor is used to resolve promises in responses because class-transformer can't do it
    // https://github.com/typestack/class-transformer/issues/549
    new ResolvePromisesInterceptor() as NestInterceptor,
    new ClassSerializerInterceptor(reflector),
  );

  // config swagger
  configSwagger(app);

  // TODO: Remove this in production, config cho mấy ae fe test trước đã
  app.enableCors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE,PATCH',
    credentials: true,
  });

  const port =
    process.env.PORT || configService.getOrThrow('app.port', { infer: true });
  await app.listen(port, '0.0.0.0');
}
void bootstrap();
