import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Notification } from '../../notification/entities/notification.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  name: string;

  @Column({
    name: 'password',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  password?: string;

  @Column({ type: 'varchar', length: 20, default: 'client' })
  type: string;

  @Column({ type: 'varchar', length: 20 })
  document: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ type: 'varchar', length: 150 })
  email: string;

  @Column({ type: 'varchar', length: 90, nullable: true })
  telephone: string;

  @Column({ name: 'whatsapp_token', type: 'text' })
  whatsAppToken: string;

  @Column({ name: 'whatsapp_id', type: 'text' })
  whatsAppId: string;

  @Column({ name: 'supabase_id', type: 'varchar', length: 255, nullable: true })
  supabaseId: string;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: string;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: string;

  @OneToMany(
    () => Notification,
    (notifications) => notifications.user,
  )
  notifications: Notification[];
}
