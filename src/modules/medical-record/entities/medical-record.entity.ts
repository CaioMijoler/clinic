import { Client } from '../../../modules/clients/entities/client.entity';
import { Feedback } from '../../../modules/feedback/entities/feedback.entity';
import { Treatment } from '../../../modules/treatment/entities/treatment.entity';
import { User } from '../../../modules/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MedicalRecordQuestion } from './medical-record-questions.entity';
import { MedicalRecordPathologies } from './medical-record-pathologies.entity';
import { Question } from '../../../modules/questions/entities/question.entity';
import { Pathology } from '../../../modules/pathologies/entities/pathology.entity';
import { AttendanceStatusEnum } from '../../../utils/enum/attendance.enum';

@Entity('medical_record')
export class MedicalRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'calendar_google_id', type: 'text', nullable: true })
  calendarGoogleId: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  title: string;

  @Column({ name: 'start_date', type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({
    type: 'text',
    nullable: true,
  })
  symptoms: string;

  @Column({
    name: 'clinical_exam',
    type: 'text',
    nullable: true,
  })
  clinicalExam: string;

  @Column({
    name: 'completed_clinical_exam',
    type: 'text',
    nullable: true,
  })
  completeClinicalExam: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  conclusion: string;

  @Column({
    name: 'client_id',
    type: 'int',
  })
  clientId: number;

  @Column({
    name: 'user_id',
    type: 'int',
  })
  userId: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  status: string;

  @Column({
    name: 'confirmation_token',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  confirmationToken: string;

  @Column({
    name: 'confirmed_at',
    type: 'timestamp',
    nullable: true,
  })
  confirmedAt: Date;

  @Column({
    name: 'reminder_sent_at',
    type: 'timestamp',
    nullable: true,
  })
  reminderSentAt: Date;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: string;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @OneToMany(() => Feedback, (feedbacks) => feedbacks.medicalRecord)
  feedbacks: Feedback[];

  @OneToMany(
    () => MedicalRecordPathologies,
    (medicalRecordPathologies) => medicalRecordPathologies.medicalRecord,
  )
  medicalRecordPathologies: MedicalRecordPathologies[];

  @OneToMany(
    () => MedicalRecordQuestion,
    (medicalRecordQuestions) => medicalRecordQuestions.medicalRecord,
  )
  medicalRecordQuestions: MedicalRecordQuestion[];

  @ManyToMany(() => Question, (question) => question.medicalRecords)
  @JoinTable({
    name: 'medical_record_questions',
    joinColumn: { name: 'medical_record_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'question_id', referencedColumnName: 'id' },
  })
  questions: Question[];

  @ManyToMany(() => Pathology, (pathology) => pathology.medicalRecords)
  @JoinTable({
    name: 'medical_record_pathologies',
    joinColumn: { name: 'medical_record_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'pathologies_id', referencedColumnName: 'id' },
  })
  pathologies: Pathology[];

  @OneToMany(() => Treatment, (treatments) => treatments.medicalRecord)
  treatments: Treatment[];
}
