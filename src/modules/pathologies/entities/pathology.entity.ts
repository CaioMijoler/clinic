import { MedicalRecordPathologies } from '../../../modules/medical-record/entities/medical-record-pathologies.entity';
import { MedicalRecord } from '../../../modules/medical-record/entities/medical-record.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('pathologies')
export class Pathology {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  code: string;

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

  @OneToMany(
    () => MedicalRecordPathologies,
    (medicalRecordPathologies) => medicalRecordPathologies.pathology,
  )
  medicalRecordPathologies: MedicalRecordPathologies[];

  @ManyToMany(() => MedicalRecord, (medicalRecord) => medicalRecord.pathologies)
  medicalRecords: MedicalRecord[];
}
