import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MedicalRecord } from './medical-record.entity';
import { Pathology } from '../../../modules/pathologies/entities/pathology.entity';

@Entity('medical_record_pathologies')
export class MedicalRecordPathologies {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'medical_record_id', type: 'int' })
  medicalRecordId: number;

  @Column({ name: 'pathologies_id', type: 'int' })
  pathologiesId: number;

  @ManyToOne(() => Pathology, (pathology) => pathology.medicalRecordPathologies)
  @JoinColumn({ name: 'pathologies_id' })
  pathology: Pathology;

  @ManyToOne(
    () => MedicalRecord,
    (medicalRecord) => medicalRecord.medicalRecordPathologies,
  )
  @JoinColumn({ name: 'medical_record_id' })
  medicalRecord: MedicalRecord;
}
