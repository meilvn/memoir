import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Brackets } from 'typeorm'
import { createWriteStream, mkdirSync, existsSync, unlinkSync, copyFileSync } from 'fs'
import { extname, join } from 'path'
import { randomUUID } from 'crypto'
import sharp from 'sharp'
import exifr from 'exifr'
import ffmpeg, { ffprobe } from 'fluent-ffmpeg'
import { Media } from '@media/entities/media.entity'
import { Note } from '@notes/entities/note.entity'
import { QueryMediaDto } from '@media/dto/query-media.dto'

const UPLOAD_DIR = join(process.cwd(), 'uploads')
const THUMB_DIR = join(process.cwd(), 'thumbnails')
const THUMB_WIDTH = 400

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function isVideo(mimeType: string) {
  return mimeType.startsWith('video/')
}

function toStr(v: string | number) {
  return typeof v === 'number' ? String(v) : v
}

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
  ) {
    ensureDir(UPLOAD_DIR)
    ensureDir(THUMB_DIR)
  }

  async upload(file: Express.Multer.File, uploadedBy: string) {
    const video = isVideo(file.mimetype)
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')

    const ext = extname(file.originalname)
    const safeName = `${Date.now()}_${randomUUID().slice(0, 8)}${ext}`
    const relDir = join(`${year}`, month, day)
    const absDir = join(UPLOAD_DIR, toStr(year), toStr(month), toStr(day))
    ensureDir(absDir)

    const absPath = join(absDir, safeName)
    copyFileSync(file.path, absPath)

    let width = 0
    let height = 0
    let duration: number | null = null
    let exifData: Record<string, any> = {}

    // Get dimensions
    try {
      const meta = await sharp(absPath).metadata()
      width = meta.width || 0
      height = meta.height || 0
    } catch {
      // video or unsupported
    }

    // Video: get duration via ffprobe
    if (video) {
      duration = await new Promise<number>((resolve) => {
        ffprobe(absPath, (err, info) => {
          resolve(err ? 0 : Math.round((info as any)?.format?.duration || 0))
        })
      })
    }

    // EXIF
    try {
      exifData = (await exifr.parse(absPath)) || {}
    } catch {
      // no exif
    }

    // Generate thumbnail
    const thumbRelDir = join(`${year}`, month, day)
    const thumbAbsDir = join(THUMB_DIR, toStr(year), toStr(month), toStr(day))
    ensureDir(thumbAbsDir)
    const thumbName = safeName.replace(ext, '_thumb.jpg')
    const thumbAbsPath = join(thumbAbsDir, thumbName)

    if (video) {
      await new Promise<void>((resolve) => {
        ffmpeg(absPath)
          .screenshots({ count: 1, size: `${THUMB_WIDTH}x?`, filename: thumbAbsPath })
          .on('end', () => resolve())
          .on('error', () => resolve())
      })
    } else {
      await sharp(absPath)
        .resize(THUMB_WIDTH, null, { withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(thumbAbsPath)
    }

    const media = this.mediaRepository.create({
      filename: safeName,
      originalPath: `/uploads/${relDir.replace(/\\/g, '/')}/${safeName}`,
      thumbnailPath: `/thumbnails/${thumbRelDir.replace(/\\/g, '/')}/${thumbName}`,
      mediaType: video ? 'VIDEO' : 'PHOTO',
      fileSize: file.size,
      mimeType: file.mimetype,
      duration: duration || 0,
      width,
      height,
      takenAt: now,
      year,
      month: Number(month),
      day: Number(day),
      exifData,
      uploadedBy,
    })

    const saved = await this.mediaRepository.save(media)

    // Cleanup temp
    try { unlinkSync(file.path) } catch {}

    return saved
  }

  async findAll(dto: QueryMediaDto) {
    const qb = this.mediaRepository.createQueryBuilder('m').orderBy('m.taken_at', 'DESC')

    if (dto.year) qb.andWhere('m.year = :year', { year: dto.year })
    if (dto.month) qb.andWhere('m.month = :month', { month: dto.month })
    if (dto.day) qb.andWhere('m.day = :day', { day: dto.day })
    if (dto.mediaType) qb.andWhere('m.media_type = :mediaType', { mediaType: dto.mediaType })
    if (dto.favorite) qb.andWhere('m.is_favorite = 1')

    // 关键词搜索：文件名 + 备注内容 + 备注标签 + 心情（LEFT JOIN 保证无备注的媒体也能匹配文件名）
    if (dto.keyword?.trim()) {
      const kw = `%${dto.keyword.trim()}%`
      qb.leftJoin(Note, 'n', 'n.media_id = m.id').andWhere(
        new Brackets((w) => {
          w.where('m.filename LIKE :kw', { kw })
            .orWhere('n.content LIKE :kw', { kw })
            .orWhere('n.tags LIKE :kw', { kw })
            .orWhere('n.mood LIKE :kw', { kw })
        }),
      )
    }

    const page = dto.page || 1
    const limit = dto.limit || 30
    qb.skip((page - 1) * limit).take(limit)

    const [items, total] = await qb.getManyAndCount()
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  // 收藏/取消收藏：切换布尔值并返回最新状态
  async toggleFavorite(id: string) {
    const media = await this.findOne(id)
    media.isFavorite = !media.isFavorite
    const saved = await this.mediaRepository.save(media)
    return { id: saved.id, isFavorite: saved.isFavorite }
  }

  async findOne(id: string) {
    const media = await this.mediaRepository.findOne({ where: { id } })
    if (!media) throw new NotFoundException('媒体不存在')
    return media
  }

  async getTimeline() {
    return this.mediaRepository
      .createQueryBuilder('m')
      .select('DISTINCT m.year', 'year')
      .addSelect('COUNT(*)', 'count')
      .groupBy('m.year')
      .orderBy('m.year', 'DESC')
      .getRawMany()
  }

  async getYears() {
    const result = await this.mediaRepository
      .createQueryBuilder('m')
      .select('DISTINCT m.year', 'year')
      .orderBy('m.year', 'DESC')
      .getRawMany()
    return result.map((r: any) => r.year)
  }

  // 历史上的今天：与今天同月日的往年媒体（不含当年），按年份倒序
  async getOnThisDay() {
    const now = new Date()
    const md = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    return this.mediaRepository
      .createQueryBuilder('m')
      .where(`strftime('%m-%d', m.taken_at) = :md`, { md })
      .andWhere('m.year <> :year', { year: now.getFullYear() })
      .orderBy('m.taken_at', 'DESC')
      .getMany()
  }

  async getMonths(year: number) {
    const result = await this.mediaRepository
      .createQueryBuilder('m')
      .select('DISTINCT m.month', 'month')
      .addSelect('COUNT(*)', 'count')
      .where('m.year = :year', { year })
      .groupBy('m.month')
      .orderBy('m.month', 'ASC')
      .getRawMany()
    return result
  }

  async getDays(year: number, month: number) {
    const result = await this.mediaRepository
      .createQueryBuilder('m')
      .select('DISTINCT m.day', 'day')
      .addSelect('COUNT(*)', 'count')
      .where('m.year = :year AND m.month = :month', { year, month })
      .groupBy('m.day')
      .orderBy('m.day', 'ASC')
      .getRawMany()
    return result
  }

  async remove(id: string) {
    const media = await this.findOne(id)
    await this.mediaRepository.remove(media)

    for (const path of [media.originalPath, media.thumbnailPath]) {
      try {
        const fp = join(process.cwd(), path.replace(/^\/+/, '').replace(/\//g, '\\'))
        if (existsSync(fp)) unlinkSync(fp)
      } catch {}
    }

    return { message: '媒体已删除' }
  }
}
