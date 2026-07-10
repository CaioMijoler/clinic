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
import { Service } from '../../services/entities/service.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';

@Entity('medical_record_services')
export class MedicalRecordService {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'medical_record_id', type: 'int' })
  medicalRecordId: number;

  @Column({ name: 'appointment_id', type: 'int', nullable: true })
  appointmentId: number | null;

  @Column({ name: 'service_id', type: 'int' })
  serviceId: number;

  @Column({ name: 'quantity_sessions', type: 'int', default: 1 })
  quantitySessions: number;

  @Column({ name: 'duration_minutes', type: 'int' })
  durationMinutes: number;

  @Column({
    name: 'total_value',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  totalValue: number;

  @Column({ type: 'boolean', default: false })
  courtesy: boolean;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  discount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: string;

  @ManyToOne(
    () => MedicalRecord,
    (medicalRecord) => medicalRecord.medicalRecordServices,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'medical_record_id' })
  medicalRecord: MedicalRecord;

  @ManyToOne(() => Service)
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @ManyToOne(() => Appointment, (appointment) => appointment.medicalRecordServices, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment | null;
}
