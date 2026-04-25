import { MedicalRecord } from '@modules/medical-record/entities/medical-record.entity';
import { Client } from '@modules/clients/entities/client.entity';
import { User } from '@modules/user/entities/user.entity';
import { MedicalRecordStatusEnum } from '@app/utils/enum/medical-record.enum';

// ─── User Factory ────────────────────────────────────────────────────────────

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    name: 'Dr. João Silva',
    email: 'joao@clinica.com',
    password: 'hashed_password',
    token: 'valid_token',
    whatsAppId: null,
    whatsAppToken: null,
    calendarId: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  } as User;
}

// ─── Client Factory ───────────────────────────────────────────────────────────

export function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: 1,
    name: 'Maria da Silva',
    document: '12345678900',
    ieRg: '123456789',
    email: 'maria@email.com',
    telephone: '16999999999',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    clientAddress: null,
    ...overrides,
  } as Client;
}

// ─── MedicalRecord Factory ────────────────────────────────────────────────────

export function makeMedicalRecord(
  overrides: Partial<MedicalRecord> = {},
): MedicalRecord {
  return {
    id: 1,
    calendarGoogleId: null,
    title: 'Consulta — Maria da Silva',
    startDate: new Date('2024-10-01T10:00:00'),
    endDate: new Date('2024-10-01T11:00:00'),
    symptoms: 'Dor nas costas e cansaço',
    clinicalExam: 'Exame físico sem alterações relevantes',
    completeClinicalExam: 'Conclusão do exame clínico',
    conclusion: 'Paciente com lombalgia leve',
    clientId: 1,
    userId: 1,
    status: MedicalRecordStatusEnum.CREATED,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    client: makeClient(),
    user: makeUser(),
    feedbacks: [],
    medicalRecordPathologies: [],
    medicalRecordQuestions: [],
    questions: [],
    pathologies: [],
    treatments: [],
    ...overrides,
  } as MedicalRecord;
}

// ─── Lista de prontuários de um cliente ──────────────────────────────────────

export function makeMedicalRecordList(
  clientId: number,
  count = 3,
): MedicalRecord[] {
  return Array.from({ length: count }, (_, index) =>
    makeMedicalRecord({
      id: index + 1,
      clientId,
      symptoms: `Sintoma ${index + 1}`,
      title: `Consulta ${index + 1}`,
      client: makeClient({ id: clientId }),
    }),
  );
}
