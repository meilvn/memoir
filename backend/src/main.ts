import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
  app.useStaticAssets('uploads', { prefix: '/uploads/' })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  )
  await app.listen(3000)
  console.log(`🚀 Server running on http://localhost:3000`)
}
bootstrap()
