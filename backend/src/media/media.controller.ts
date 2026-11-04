import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  Query,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { MediaService } from '@media/media.service'
import { CurrentUser } from '@common/decorators/current-user.decorator'
import { QueryMediaDto } from '@media/dto/query-media.dto'

@Controller('media')
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    return this.mediaService.upload(file, user.sub)
  }

  @Get()
  findAll(@Query() dto: QueryMediaDto) {
    return this.mediaService.findAll(dto)
  }

  @Get('years')
  getYears() {
    return this.mediaService.getYears()
  }

  @Get('on-this-day')
  getOnThisDay() {
    return this.mediaService.getOnThisDay()
  }

  @Get('timeline')
  getTimeline() {
    return this.mediaService.getTimeline()
  }

  // 统计洞察页数据
  @Get('stats')
  getStats() {
    return this.mediaService.getStats()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(id)
  }

  // 收藏/取消收藏（切换）
  @Patch(':id/favorite')
  toggleFavorite(@Param('id') id: string) {
    return this.mediaService.toggleFavorite(id)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mediaService.remove(id)
  }
}
