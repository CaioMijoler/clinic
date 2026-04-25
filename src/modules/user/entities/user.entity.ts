import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @Column({ name: 'client_email', type: 'text', nullable: true })
  clientEmail: string;

  @Column({ name: 'private_key', type: 'text', nullable: true })
  privateKey: string;

  @Column({ name: 'calendar_id', type: 'text' })
  calendarId: string;

  @Column({ name: 'whatsapp_token', type: 'text' })
  whatsAppToken: string;

  @Column({ name: 'whatsapp_id', type: 'text' })
  whatsAppId: string;

  @Column({ name: 'supabase_id', type: 'varchar', length: 255, nullable: true })
  supabaseId: string;

  @Column({ type: 'text' })
  token: string;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: string;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: string;
}
