import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MulterModule } from '@nestjs/platform-express'
import { MediaService } from './media.service'
import { MediaController } from './media.controller'
import { Media } from '@media/entities/media.entity'
import { diskStorage } from 'multer'
import { extname, join } from 'path'
import { randomUUID } from 'crypto'

@Module({
  imports: [
    TypeOrmModule.forFeature([Media]),
    MulterModule.register({
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'temp'),
        filename: (req, file, cb) => {
          const extName = extname(file.originalname)
          cb(null, `${Date.now()}_${randomUUID().slice(0, 8)}${extName}`)
        },
      }),
      limits: { fileSize: 500 * 1024 * 1024 },
    }),
  ],
  providers: [MediaService],
  controllers: [MediaController],
  exports: [MediaService, TypeOrmModule],
})
export class MediaModule {}
