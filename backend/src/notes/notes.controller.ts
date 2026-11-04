import { Controller, Post, Get, Body, Param } from '@nestjs/common'
import { NotesService } from '@notes/notes.service'
import { CreateNoteDto } from '@notes/dto/create-note.dto'
import { CurrentUser } from '@common/decorators/current-user.decorator'

@Controller('notes')
export class NotesController {
  constructor(private notesService: NotesService) {}

  @Post()
  upsert(@CurrentUser() user: any, @Body() dto: CreateNoteDto & { mediaId: string }) {
    return this.notesService.upsert(dto.mediaId, user.sub, dto)
  }

  @Get('my')
  findMy(@CurrentUser() user: any) {
    return this.notesService.findMyNotes(user.sub)
  }

  // 标签云：所有标签及使用次数
  @Get('tags')
  getAllTags() {
    return this.notesService.getAllTags()
  }

  @Get(':mediaId')
  findByMedia(@Param('mediaId') mediaId: string) {
    return this.notesService.findByMedia(mediaId)
  }
}
