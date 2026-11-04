import { IsString, Length, IsOptional, IsBoolean } from 'class-validator'

export class CreateAlbumDto {
  @IsString()
  @Length(1, 120)
  name: string

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean
}
