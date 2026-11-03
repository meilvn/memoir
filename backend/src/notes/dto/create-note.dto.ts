import { IsString, IsOptional, IsArray } from 'class-validator'

export class CreateNoteDto {
  @IsString()
  content: string

  @IsString()
  @IsOptional()
  mood?: string

  @IsArray()
  @IsOptional()
  tags?: string[]
}
