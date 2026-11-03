import { IsString, IsOptional, MinLength, MaxLength, IsUrl, IsEmail, IsUUID } from 'class-validator'

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  nickname?: string

  @IsString()
  @IsOptional()
  @IsUrl()
  avatarUrl?: string
}

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string

  @IsString()
  @IsEmail()
  email: string

  @IsString()
  @MinLength(6)
  password: string

  @IsString()
  @IsOptional()
  role?: string
}

export class UpdateUserRoleDto {
  @IsString()
  role: string
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string

  @IsString()
  @MinLength(6)
  newPassword: string
}
