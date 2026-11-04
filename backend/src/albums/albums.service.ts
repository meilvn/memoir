import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Album } from './entities/album.entity'
import { CreateAlbumDto } from './dto/create-album.dto'
import { UpdateAlbumDto } from './dto/update-album.dto'

@Injectable()
export class AlbumsService {
  constructor(
    @InjectRepository(Album)
    private albumsRepo: Repository<Album>,
  ) {}

  async create(dto: CreateAlbumDto, userId: string) {
    const album = this.albumsRepo.create({
      name: dto.name,
      description: dto.description,
      isPublic: dto.isPublic ?? false,
      createdBy: userId,
    })
    return this.albumsRepo.save(album)
  }

  async findAll(userId: string) {
    const qb = this.albumsRepo.createQueryBuilder('a')
    qb.where('a.created_by = :uid OR a.is_public = true', { uid: userId })
    qb.orderBy('a.updated_at', 'DESC')
    return qb.getMany()
  }

  async findOne(id: string, userId: string) {
    const album = await this.albumsRepo.findOne({ where: { id } })
    if (!album) throw new NotFoundException('相册不存在')
    if (album.createdBy !== userId && !album.isPublic) {
      throw new ForbiddenException('无权访问此相册')
    }
    return album
  }

  async update(id: string, dto: UpdateAlbumDto, userId: string) {
    const album = await this.findOne(id, userId)
    if (album.createdBy !== userId) {
      throw new ForbiddenException('无权编辑此相册')
    }
    Object.assign(album, dto)
    return this.albumsRepo.save(album)
  }

  async remove(id: string, userId: string) {
    const album = await this.findOne(id, userId)
    if (album.createdBy !== userId) {
      throw new ForbiddenException('无权删除此相册')
    }
    // Remove album reference from media
    await this.albumsRepo.manager.createQueryBuilder()
      .update('media')
      .set({ albumId: null })
      .where('album_id = :id', { id })
      .execute()
    await this.albumsRepo.remove(album)
  }

  async addMedia(albumId: string, mediaId: string, userId: string) {
    const album = await this.findOne(albumId, userId)
    if (album.createdBy !== userId) {
      throw new ForbiddenException('无权编辑此相册')
    }
    await this.albumsRepo.manager.createQueryBuilder()
      .update('media')
      .set({ albumId })
      .where('id = :mid', { mid: mediaId })
      .execute()
    return album
  }

  async removeMedia(albumId: string, mediaId: string, userId: string) {
    const album = await this.findOne(albumId, userId)
    if (album.createdBy !== userId) {
      throw new ForbiddenException('无权编辑此相册')
    }
    await this.albumsRepo.manager.createQueryBuilder()
      .update('media')
      .set({ albumId: null })
      .where('id = :mid AND album_id = :aid', { mid: mediaId, aid: albumId })
      .execute()
    return album
  }
}
