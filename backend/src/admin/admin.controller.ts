import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common'
import { UsersService } from '@users/users.service'
import { Roles } from '@common/decorators/roles.decorator'
import { CreateUserDto, UpdateUserRoleDto } from '@users/dto/users.dto'

@Controller('admin')
@Roles('ADMIN')
export class AdminController {
  constructor(private usersService: UsersService) {}

  @Get('users')
  getUsers() {
    return this.usersService.findAll()
  }

  @Post('users')
  createUser(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto, 'admin')
  }

  @Patch('users/:id/role')
  updateUserRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.usersService.updateRole(id, dto)
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.usersService.remove(id)
  }
}
