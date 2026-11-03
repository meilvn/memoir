import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator'

export class RegisterDto {
  @IsString()
  @MinLength(3, { message: '用户名至少 3 个字符' })
  @MaxLength(50, { message: '用户名最多 50 个字符' })
  username: string

  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string

  @IsString()
  @MinLength(6, { message: '密码至少 6 个字符' })
  @MaxLength(100, { message: '密码最多 100 个字符' })
  password: string
}

export class LoginDto {
  @IsString()
  @MinLength(3)
  identifier: string

  @IsString()
  @MinLength(6)
  password: string
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string
}

export class ResetPasswordDto {
  @IsString()
  token: string

  @IsString()
  @MinLength(6)
  password: string
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string

  @IsString()
  @MinLength(6)
  newPassword: string
}
