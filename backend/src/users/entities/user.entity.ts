import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true, length: 50 })
  username: string

  @Column({ unique: true, length: 100 })
  email: string

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string

  @Column({ name: 'nickname', length: 50, nullable: true })
  nickname: string

  @Column({ name: 'avatar_url', length: 255, nullable: true })
  avatarUrl: string

  @Column({ type: 'varchar', length: 20, default: 'MEMBER' })
  role: string

  @Column({ name: 'reset_token', length: 255, nullable: true })
  resetToken: string

  @Column({ name: 'reset_token_expires', type: 'datetime', nullable: true })
  resetTokenExpires: Date

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
