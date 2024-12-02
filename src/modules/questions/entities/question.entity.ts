import { MedicalRecordQuestion } from '../../../modules/medical-record/entities/medical-record-questions.entity';
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

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  response: string;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: string;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: string;

  @OneToMany(
    () => MedicalRecordQuestion,
    (medicalRecordQuestion) => medicalRecordQuestion.questions,
  )
  medicalRecordQuestions: MedicalRecordQuestion[];

  @ManyToMany(() => MedicalRecord, (medicalRecord) => medicalRecord.questions)
  medicalRecords: MedicalRecord[];
}
