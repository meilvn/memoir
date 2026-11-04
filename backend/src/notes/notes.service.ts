import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Note } from '@notes/entities/note.entity'
import { CreateNoteDto } from '@notes/dto/create-note.dto'

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private notesRepository: Repository<Note>,
  ) {}

  async upsert(mediaId: string, userId: string, dto: CreateNoteDto) {
    const existing = await this.notesRepository.findOne({ where: { mediaId } })

    if (existing) {
      existing.content = dto.content
      existing.mood = dto.mood || null
      existing.tags = dto.tags || []
      return this.notesRepository.save(existing)
    }

    const note = this.notesRepository.create({
      mediaId,
      userId,
      content: dto.content,
      mood: dto.mood || null,
      tags: dto.tags || [],
    })
    return this.notesRepository.save(note)
  }

  async findByMedia(mediaId: string) {
    const note = await this.notesRepository.findOne({
      where: { mediaId },
    })
    if (!note) throw new NotFoundException('该媒体暂无备注')
    return note
  }

  async findMyNotes(userId: string) {
    return this.notesRepository.find({
      where: { userId },
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
