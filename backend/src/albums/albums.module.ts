import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AlbumsService } from './albums.service'
import { AlbumsController } from './albums.controller'
import { Album } from './entities/album.entity'
import { Media } from '../media/entities/media.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Album, Media])],
  controllers: [AlbumsController],
  providers: [AlbumsService],
  exports: [AlbumsService],
})
export class AlbumsModule {}
