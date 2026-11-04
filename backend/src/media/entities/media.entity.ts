import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { User } from '../../users/entities/user.entity'
import { Album } from '@albums/entities/album.entity'

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'filename', length: 255 })
  filename: string

  @Column({ name: 'original_path', length: 500 })
  originalPath: string

  @Column({ name: 'thumbnail_path', length: 500 })
  thumbnailPath: string

  @Column({ name: 'media_type', type: 'varchar', length: 20 })
  mediaType: 'PHOTO' | 'VIDEO'

  @Column({ name: 'file_size', type: 'bigint', nullable: true })
  fileSize: number

  @Column({ name: 'mime_type', length: 50, nullable: true })
  mimeType: string

  @Column({ name: 'duration', type: 'int', nullable: true })
  duration: number

  @Column({ type: 'int' })
  width: number

  @Column({ type: 'int' })
  height: number

  @Column({ name: 'taken_at', type: 'datetime' })
  takenAt: Date

  // 是否收藏（心形标记，家庭相册的"珍藏"）
  @Column({ name: 'is_favorite', type: 'boolean', default: false })
  isFavorite: boolean

  @Column({ type: 'int' })
  year: number

  @Column({ type: 'int' })
  month: number

  @Column({ type: 'int' })
  day: number

  @Column({ name: 'exif_data', type: 'jsonb', nullable: true })
  exifData: Record<string, any>

  @Column({ name: 'uploaded_by', type: 'uuid', nullable: true })
  uploadedBy: string

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User

  @Column({ name: 'album_id', type: 'uuid', nullable: true })
  albumId: string

  @ManyToOne(() => Album, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'album_id' })
  album: Album

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
