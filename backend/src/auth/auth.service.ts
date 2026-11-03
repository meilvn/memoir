import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { User } from '@users/entities/user.entity'
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto } from './dto/auth.dto'
import { randomUUID } from 'crypto'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(identifier: string, password: string): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: [
        { username: identifier },
        { email: identifier },
      ],
    })
    if (user && await bcrypt.compare(password, user.passwordHash)) {
      const { passwordHash: _, ...result } = user as any
      return result
    }
    return null
  }

  async login(identifier: string, password: string) {
    const user = await this.validateUser(identifier, password)
    if (!user) throw new UnauthorizedException('用户名或密码错误')

    const payload = { sub: user.id, username: user.username, role: user.role }
    const accessToken = this.jwtService.sign(payload)

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    }
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersRepository.findOne({
      where: [{ username: dto.username }, { email: dto.email }],
    })
    if (existing) throw new ConflictException('用户名或邮箱已被注册')

    const passwordHash = await bcrypt.hash(dto.password, 10)
    const user = this.usersRepository.create({
      username: dto.username,
      email: dto.email,
      passwordHash,
      role: 'MEMBER',
    })
    const saved = await this.usersRepository.save(user)
    const { passwordHash: _, ...result } = saved as any
    return result
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersRepository.findOne({ where: { email: dto.email } })
    if (!user) return { message: '如果邮箱存在，重置链接已发送' }

    const token = randomUUID()
    user.resetToken = token
    user.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await this.usersRepository.save(user)

    // TODO: 实际项目中应发送邮件，这里返回 token 供前端测试
    console.log(`🔑 Password reset token for ${user.email}: ${token}`)
    return { message: '重置链接已发送（查看后端日志获取 token）', token }
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersRepository.findOne({
      where: { resetToken: dto.token },
    })
    if (!user || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
      throw new BadRequestException('重置链接无效或已过期')
    }

    user.passwordHash = await bcrypt.hash(dto.password, 10)
    user.resetToken = null as any
    user.resetTokenExpires = null as any
    await this.usersRepository.save(user)
    return { message: '密码重置成功' }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersRepository.findOne({ where: { id: userId } })
    if (!user) throw new UnauthorizedException('用户不存在')

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash)
    if (!valid) throw new BadRequestException('当前密码错误')

    user.passwordHash = await bcrypt.hash(dto.newPassword, 10)
    await this.usersRepository.save(user)
    return { message: '密码已更新' }
  }
}
