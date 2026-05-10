import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MedicalRecord } from '../../medical-record/entities/medical-record.entity';
import { User } from '../../user/entities/user.entity';

@Entity('notification')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'text',
  })
  description: string;

  @Column({
    name: 'medical_record_id',
    type: 'int',
  })
  medicalRecordId: number;

  @Column({
    name: 'user_id',
    type: 'int',
  })
  userId: number;

  @Column({
    type: 'boolean',
    default: false,
  })
  read: boolean;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: string;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: string;

  @ManyToOne(() => MedicalRecord, (medicalRecord) => medicalRecord.notifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'medical_record_id' })
  medicalRecord: MedicalRecord;

  @ManyToOne(() => User, (user) => user.notifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
