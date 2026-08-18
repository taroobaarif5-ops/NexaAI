import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

let app: any;

export default async function handler(req: any, res: any) {
  if (!app) {
    const nestApp = await NestFactory.create(AppModule);

    nestApp.enableCors({
      origin: true,
      credentials: true,
    });

    await nestApp.init();

    app = nestApp.getHttpAdapter().getInstance();
  }

  return app(req, res);
}