import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AuthGuard } from './auth.guard'
import { RolesGuard } from './roles.guard'
import { JwtStrategy } from '@auth/strategies/jwt.strategy'

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'family-memoir-secret',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [AuthGuard, RolesGuard, JwtStrategy],
  exports: [AuthGuard, RolesGuard],
})
export class GuardsModule {}
