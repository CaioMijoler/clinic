import { MedicalRecord } from '../../../modules/medical-record/entities/medical-record.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('feedback')
export class Feedback {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  description: string;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: string;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: string;

  @Column({
    name: 'medical_record_id',
    type: 'int',
  })
  medicalRecordId: number;

  @ManyToOne(() => MedicalRecord, (medical) => medical.feedbacks)
  @JoinColumn({ name: 'medical_record_id' })
  medicalRecord: MedicalRecord;
}
