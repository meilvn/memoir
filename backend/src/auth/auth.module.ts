import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { UsersModule } from '@users/users.module'
import { JwtConfigModule } from './jwt-config.module'
import { PassportModule } from '@nestjs/passport'
import { JwtStrategy } from './strategies/jwt.strategy'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from '@users/entities/user.entity'

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([User]),
    JwtConfigModule,
    PassportModule,
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
