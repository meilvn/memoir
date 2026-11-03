import { Type } from 'class-transformer'
import { IsOptional, IsInt, IsString, IsEnum, Min, Max } from 'class-validator'

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
  @Max(100)
  @Type(() => Number)
  limit?: number
}
