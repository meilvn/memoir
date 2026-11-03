import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  app.enableCors({
    // 反射请求来源，允许任意 origin（本地开发可能使用 5173/5174 等不同端口或局域网 IP）
    // 生产环境如需收紧，可改为 origin: ['https://your-domain.com'] 白名单
    origin: true,
    credentials: true,
  })
  app.useStaticAssets('uploads', { prefix: '/uploads/' })
  app.useStaticAssets('thumbnails', { prefix: '/thumbnails/' })
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
