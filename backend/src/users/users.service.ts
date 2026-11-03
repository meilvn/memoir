import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { User } from '@users/entities/user.entity'
import { CreateUserDto, UpdateUserRoleDto, UpdateProfileDto, ChangePasswordDto } from '@users/dto/users.dto'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll() {
    return this.usersRepository.find({
      order: { createdAt: 'DESC' },
    })
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } })
    if (!user) throw new NotFoundException('用户不存在')
    const { passwordHash, ...result } = user as any
    return result
  }

  async findMe(userId: string) {
    return this.findOne(userId)
  }

  async create(dto: CreateUserDto, currentUserId: string) {
    const existing = await this.usersRepository.findOne({
      where: [{ username: dto.username }, { email: dto.email }],
    })
    if (existing) throw new ConflictException('用户名或邮箱已被注册')

    const passwordHash = await bcrypt.hash(dto.password, 10)
    const user = this.usersRepository.create({
      username: dto.username,
      email: dto.email,
      passwordHash,
      role: dto.role || 'MEMBER',
    })
    const saved = await this.usersRepository.save(user)
    const { passwordHash: _, ...result } = saved as any
    return result
  }

  async updateRole(userId: string, dto: UpdateUserRoleDto) {
    const user = await this.usersRepository.findOne({ where: { id: userId } })
    if (!user) throw new NotFoundException('用户不存在')
    user.role = dto.role
    return this.usersRepository.save(user)
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.usersRepository.findOne({ where: { id: userId } })
    if (!user) throw new NotFoundException('用户不存在')
    if (dto.nickname !== undefined) user.nickname = dto.nickname
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl
    return this.usersRepository.save(user)
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersRepository.findOne({ where: { id: userId } })
    if (!user) throw new ForbiddenException('用户不存在')

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash)
    if (!valid) throw new ForbiddenException('当前密码错误')

    user.passwordHash = await bcrypt.hash(dto.newPassword, 10)
    return this.usersRepository.save(user)
  }

  async remove(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } })
    if (!user) throw new NotFoundException('用户不存在')
    await this.usersRepository.remove(user)
    return { message: '用户已删除' }
  }
}
