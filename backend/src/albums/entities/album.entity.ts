import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm'
import { User } from '../../users/entities/user.entity'
import { Media } from '../../media/entities/media.entity'

@Entity('albums')
export class Album {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'name', length: 120 })
  name: string

  @Column({ name: 'description', length: 500, nullable: true })
  description: string

  @Column({ name: 'cover_path', length: 500, nullable: true })
  coverPath: string

  @Column({ name: 'media_type', type: 'varchar', length: 20, nullable: true })
  mediaType: 'PHOTO' | 'VIDEO' | null

  @Column({ name: 'is_public', type: 'boolean', default: false })
  isPublic: boolean

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  creator: User

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @OneToMany(() => Media, (m) => m.album)
  media: Media[]
}
