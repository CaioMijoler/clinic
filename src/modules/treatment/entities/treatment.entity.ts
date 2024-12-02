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

@Entity('treatment')
export class Treatment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  description: string;

  @Column({
    name: 'medical_record_id',
    type: 'int',
  })
  medicalRecordId: number;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: string;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: string;

  @ManyToOne(() => MedicalRecord, (medical) => medical.pathologies)
  @JoinColumn({ name: 'medical_record_id' })
  medicalRecord: MedicalRecord;
}
