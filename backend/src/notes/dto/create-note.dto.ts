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

  // 附加照片 id（最多 8 个，连同封面共 9 张）
  @IsArray()
  @IsOptional()
  extraMediaIds?: string[]
}
