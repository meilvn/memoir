import {
  Controller,
  Post,
  Get,
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(id)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mediaService.remove(id)
  }
}
