import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { Media } from '../../media/entities/media.entity'
import { User } from '../../users/entities/user.entity'

@Entity('notes')
export class Note {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'media_id', type: 'uuid' })
  mediaId: string

  @ManyToOne(() => Media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'media_id' })
  media: Media

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ type: 'text' })
  content: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  mood: string | null

  @Column({ name: 'tags', type: 'jsonb', nullable: true })
  tags: string[]

  // 故事附加照片（最多 8 张；封面仍是 mediaId，总计最多 9 张）
  @Column({ name: 'extra_media_ids', type: 'jsonb', nullable: true })
  extraMediaIds: string[] | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
