import { Client } from './client.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
} from 'typeorm';

@Entity('client_address')
export class ClientAddress {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'client_id', type: 'int' })
  clientId: number;

  @Column({ name: 'zip_code', type: 'varchar', length: 8, nullable: true })
  zipCode: string;

  @Column({ type: 'varchar', length: 70, nullable: true })
  street: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  neighborhood: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 2, nullable: true })
  state: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  number: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  complement: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: string;

  @OneToOne(() => Client, (client) => client.clientAddress)
  @JoinColumn({ name: 'client_id' })
  client?: Client;
}
