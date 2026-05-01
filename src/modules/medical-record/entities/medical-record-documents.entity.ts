import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MedicalRecord } from './medical-record.entity';

@Entity('medical_record_documents')
export class MedicalRecordDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'medical_record_id', type: 'int' })
  medicalRecordId: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text' })
  path: string;

  @Column({ name: 'content_type', type: 'varchar', length: 100 })
  contentType: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => MedicalRecord, (medicalRecord) => medicalRecord.medicalRecordDocuments)
  @JoinColumn({ name: 'medical_record_id' })
  medicalRecord: MedicalRecord;
}
