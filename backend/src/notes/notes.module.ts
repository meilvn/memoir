import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { NotesService } from './notes.service'
import { NotesController } from './notes.controller'
import { Note } from '@notes/entities/note.entity'
import { Media } from '../media/entities/media.entity'
@Module({
  imports: [TypeOrmModule.forFeature([Note, Media])],
  providers: [NotesService],
  controllers: [NotesController],
  exports: [NotesService, TypeOrmModule],
})
export class NotesModule {}
