import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { Note } from '@notes/entities/note.entity'
import { Media } from '../media/entities/media.entity'
import { CreateNoteDto } from '@notes/dto/create-note.dto'

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private notesRepository: Repository<Note>,
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
  ) {}

  async upsert(mediaId: string, userId: string, dto: CreateNoteDto) {
    const existing = await this.notesRepository.findOne({ where: { mediaId } })
    const extra = Array.isArray(dto.extraMediaIds) ? dto.extraMediaIds.slice(0, 8) : []

    if (existing) {
      existing.content = dto.content
      existing.mood = dto.mood || null
      existing.tags = dto.tags || []
      existing.extraMediaIds = extra
      return this.notesRepository.save(existing)
    }

    const note = this.notesRepository.create({
      mediaId,
      userId,
      content: dto.content,
      mood: dto.mood || null,
      tags: dto.tags || [],
      extraMediaIds: extra,
    })
    return this.notesRepository.save(note)
  }

  async findByMedia(mediaId: string) {
    const note = await this.notesRepository.findOne({
      where: { mediaId },
    })
    if (!note) throw new NotFoundException('该媒体暂无备注')
    // 附加照片 id 数组 → 查出完整媒体对象返回给前端展示
    const ids = (note.extraMediaIds || []).filter(Boolean)
    const extraMedias = ids.length ? await this.mediaRepository.findBy({ id: In(ids) }) : []
    return { ...note, extraMedias }
  }

  async remove(id: string, userId: string) {
    const note = await this.notesRepository.findOne({ where: { id } })
    if (!note) throw new NotFoundException('故事不存在')
    if (note.userId !== userId) throw new ForbiddenException('不能删除他人的故事')
    await this.notesRepository.remove(note)
    return { success: true }
  }

  async findMyNotes(userId: string) {
    return this.notesRepository.find({
      where: { userId },
      relations: { media: true },
      order: { createdAt: 'DESC' },
    })
  }

  // 标签云：聚合所有备注的标签及出现次数，按次数倒序
  async getAllTags() {
    const notes = await this.notesRepository.find({ select: { tags: true } })
    const counter = new Map()
    for (const n of notes) {
      for (const t of n.tags || []) {
        const tag = String(t).trim()
        if (tag) counter.set(tag, (counter.get(tag) || 0) + 1)
      }
    }
    return [...counter.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
  }
}
