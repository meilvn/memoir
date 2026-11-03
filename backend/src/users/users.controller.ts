import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common'
import { UsersService } from '@users/users.service'
import { CurrentUser } from '@common/decorators/current-user.decorator'
import { Roles } from '@common/decorators/roles.decorator'
import { CreateUserDto, UpdateUserRoleDto, UpdateProfileDto, ChangePasswordDto } from '@users/dto/users.dto'

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: any) {
    return this.usersService.findOne(user.sub)
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.sub, dto)
  }

  @Post('me/change-password')
  changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(user.sub, dto)
  }

  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.usersService.findAll()
  }

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateUserDto, @CurrentUser() user: any) {
    return this.usersService.create(dto, user.sub)
  }

  @Patch(':id/role')
  @Roles('ADMIN')
  updateRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.usersService.updateRole(id, dto)
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id)
  }
}
