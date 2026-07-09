import { User } from '../../user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 255,
  })
  name: string;

  @Column({
    type: 'boolean',
    default: true,
  })
  active: boolean;

  @Column({
    name: 'duration_minutes',
    type: 'int',
  })
  durationMinutes: number;

  @Column({
    name: 'price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  price: number;

  @Column({
    name: 'user_id',
    type: 'int',
  })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: string;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: string;
}
