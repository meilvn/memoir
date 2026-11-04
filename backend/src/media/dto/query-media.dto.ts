import { Type, Transform } from 'class-transformer'
import { IsOptional, IsInt, IsString, IsEnum, IsBoolean, MaxLength, Min, Max } from 'class-validator'

export class QueryMediaDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  year?: number

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month?: number

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  @Type(() => Number)
  day?: number

  @IsOptional()
  @IsEnum(['PHOTO', 'VIDEO'])
  mediaType?: 'PHOTO' | 'VIDEO'

  // 只看收藏：传 true 时仅返回 is_favorite = 1 的媒体
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  favorite?: boolean

  // 关键词：匹配文件名、备注内容、备注标签、心情
  @IsOptional()
  @IsString()
  @MaxLength(100)
  keyword?: string

  @IsOptional()
  @IsString()
  tag?: string

  @IsOptional()
  @IsString()
  mood?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  @Type(() => Number)
  limit?: number

  @IsOptional()
  @IsString()
  startDate?: string

  @IsOptional()
  @IsString()
  endDate?: string
}
