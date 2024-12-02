import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MedicalRecord } from './medical-record.entity';
import { Question } from '../../../modules/questions/entities/question.entity';

@Entity('medical_record_questions')
export class MedicalRecordQuestion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'medical_record_id',
    type: 'int',
  })
  medicalRecordId: number;

  @Column({
    name: 'question_id',
    type: 'int',
  })
  questionId: number;

  @ManyToOne(() => Question, (questions) => questions.medicalRecordQuestions)
  @JoinColumn({ name: 'question_id' })
  questions: Question;

  @ManyToOne(
    () => MedicalRecord,
    (medicalRecord) => medicalRecord.medicalRecordQuestions,
  )
  @JoinColumn({ name: 'medical_record_id' })
  medicalRecord: MedicalRecord;
}
