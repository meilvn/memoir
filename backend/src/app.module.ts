import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '@auth/auth.module'
import { UsersModule } from '@users/users.module'
import { MediaModule } from '@media/media.module'
import { NotesModule } from '@notes/notes.module'
import { AdminModule } from '@admin/admin.module'
import { AlbumsModule } from '@albums/albums.module'
import { JwtConfigModule } from '@auth/jwt-config.module'
import { User } from '@users/entities/user.entity'
import { Media } from '@media/entities/media.entity'
import { Note } from '@notes/entities/note.entity'
import { Album } from '@albums/entities/album.entity'
import { APP_GUARD } from '@nestjs/core'
import { AuthGuard } from '@common/guards/auth.guard'
import { RolesGuard } from '@common/guards/roles.guard'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3' as any,
      database: process.env.DATABASE_PATH || './family_memoir.db',
      entities: [User, Media, Note, Album],
      synchronize: true,
      logging: false,
    }),
    JwtConfigModule,
    AuthModule,
    UsersModule,
    MediaModule,
    NotesModule,
    AdminModule,
    AlbumsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
