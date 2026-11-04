import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common'
import { AlbumsService } from './albums.service'
import { CreateAlbumDto } from './dto/create-album.dto'
import { UpdateAlbumDto } from './dto/update-album.dto'
import { CurrentUser } from '@common/decorators/current-user.decorator'

@Controller('albums')
export class AlbumsController {
  constructor(private albumsService: AlbumsService) {}

  @Post()
  create(@Body() dto: CreateAlbumDto, @CurrentUser() user: any) {
    return this.albumsService.create(dto, user.sub)
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.albumsService.findAll(user.sub)
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.albumsService.findOne(id, user.sub)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAlbumDto, @CurrentUser() user: any) {
    return this.albumsService.update(id, dto, user.sub)
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.albumsService.remove(id, user.sub)
  }

  @Post(':albumId/media/:mediaId')
  addMedia(@Param('albumId') albumId: string, @Param('mediaId') mediaId: string, @CurrentUser() user: any) {
    return this.albumsService.addMedia(albumId, mediaId, user.sub)
  }

  @Delete(':albumId/media/:mediaId')
  removeMedia(@Param('albumId') albumId: string, @Param('mediaId') mediaId: string, @CurrentUser() user: any) {
    return this.albumsService.removeMedia(albumId, mediaId, user.sub)
  }
}
