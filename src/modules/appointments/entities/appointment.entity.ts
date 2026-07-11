import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MedicalRecord } from '../../medical-record/entities/medical-record.entity';
import { User } from '../../user/entities/user.entity';
import { MedicalRecordService } from '../../medical-record/entities/medical-record-service.entity';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'medical_record_id', type: 'int' })
  medicalRecordId: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ name: 'start_date', type: 'timestamp' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp' })
  endDate: Date;

  @Column({ type: 'varchar', length: 255 })
  status: string;

  @Column({ name: 'quantity_sessions', type: 'int', default: 1 })
  quantitySessions: number;

  /**
   * Comparecimento no dia da consulta (profissional).
   * - `null`  → ainda não informado
   * - `true`  → compareceu (mantém o status do agendamento)
   * - `false` → faltou (status passa a `canceled_schedule`)
   */
  @Column({ type: 'boolean', nullable: true, default: null })
  attended: boolean | null;

  /**
   * Quem cancelou o agendamento.
   * - `client` → paciente (link de confirmação)
   * - `admin`  → profissional/admin (calendário ou falta)
   * - `null`   → não cancelado
   */
  @Column({ name: 'canceled_by', type: 'varchar', length: 50, nullable: true })
  canceledBy: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({
    name: 'total_value',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  totalValue: number | null;

  @Column({
    name: 'confirmation_token',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  confirmationToken: string | null;

  @Column({ name: 'confirmed_at', type: 'timestamp', nullable: true })
  confirmedAt: Date | null;

  @Column({ name: 'reminder_sent_at', type: 'timestamp', nullable: true })
  reminderSentAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: string;

  @ManyToOne(() => MedicalRecord, (medicalRecord) => medicalRecord.appointments)
  @JoinColumn({ name: 'medical_record_id' })
  medicalRecord: MedicalRecord;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(
    () => MedicalRecordService,
    (medicalRecordService) => medicalRecordService.appointment,
  )
  medicalRecordServices: MedicalRecordService[];
}
