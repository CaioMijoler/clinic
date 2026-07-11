import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { MedicalRecordService } from '../../src/modules/medical-record/medical-record.service';
import { MedicalRecord } from '../../src/modules/medical-record/entities/medical-record.entity';
import { MedicalRecordDocument } from '../../src/modules/medical-record/entities/medical-record-documents.entity';
import { Appointment } from '../../src/modules/appointments/entities/appointment.entity';
import { FilterDto } from '../../src/utils/filter-dto';
import { MedicalRecordStatusEnum } from '../../src/utils/enum/medical-record.enum';
import { AppointmentStatusEnum } from '../../src/utils/enum/appointment-status.enum';
import { AppointmentCanceledByEnum } from '../../src/utils/enum/appointment-canceled-by.enum';
import * as queryBuilderUtil from '../../src/utils/query-builder';
import {
  makeMedicalRecord,
  makeMedicalRecordList,
} from './medical-record.factory';

// ─── Mock do findAllWithQueryBuilder ─────────────────────────────────────────
jest.mock('../../src/utils/query-builder', () => ({
  findAllWithQueryBuilder: jest.fn(),
}));

const mockFindAll = queryBuilderUtil.findAllWithQueryBuilder as jest.Mock;

// ─── Mock do Repository ───────────────────────────────────────────────────────
const mockRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockDocumentRepository = {
  findOne: jest.fn(),
  find: jest.fn(),
};

const mockAppointmentRepository = {
  findOne: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ completed: '0' }),
  }),
};

// ─── Mock do DataSource ───────────────────────────────────────────────────────
const mockDataSource = {
  transaction: jest.fn(),
  getRepository: jest.fn().mockReturnValue({
    createQueryBuilder: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: '0', completed: '0' }),
    }),
  }),
  manager: {
    findOne: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    merge: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  },
};

async function createServiceModule(): Promise<MedicalRecordService> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      MedicalRecordService,
      {
        provide: getRepositoryToken(MedicalRecord),
        useValue: mockRepository,
      },
      {
        provide: getRepositoryToken(MedicalRecordDocument),
        useValue: mockDocumentRepository,
      },
      {
        provide: getRepositoryToken(Appointment),
        useValue: mockAppointmentRepository,
      },
      {
        provide: getDataSourceToken(),
        useValue: mockDataSource,
      },
    ],
  }).compile();

  return module.get<MedicalRecordService>(MedicalRecordService);
}

// ─────────────────────────────────────────────────────────────────────────────

describe('MedicalRecordService — findByClient', () => {
  let service: MedicalRecordService;

  beforeEach(async () => {
    service = await createServiceModule();
    jest.clearAllMocks();
  });

  // ─── Cenário 1: Retorna lista de prontuários do cliente ────────────────────
  describe('quando o cliente tem prontuários', () => {
    it('deve retornar os prontuários do clientId informado', async () => {
      const clientId = 1;
      const records = makeMedicalRecordList(clientId, 3);
      mockFindAll.mockResolvedValueOnce(records);

      const result = await service.findByClient(clientId, {});

      expect(mockFindAll).toHaveBeenCalledWith(
        mockRepository,
        expect.objectContaining({
          filter: expect.objectContaining({ clientId: '1' }),
        }),
        'mr',
      );
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ clientId: 1 }),
        ]),
      );
      expect((result as MedicalRecord[]).length).toBe(3);
    });
  });

  // ─── Cenário 2: Retorna lista vazia ────────────────────────────────────────
  describe('quando o cliente não tem prontuários', () => {
    it('deve retornar array vazio', async () => {
      mockFindAll.mockResolvedValueOnce([]);

      const result = await service.findByClient(99, {});

      expect(result).toEqual([]);
    });
  });

  // ─── Cenário 3: Filtros extras do caller são preservados ───────────────────
  describe('quando queryParams já possui filtros', () => {
    it('deve mesclar clientId com os filtros existentes', async () => {
      const clientId = 5;
      mockFindAll.mockResolvedValueOnce([]);

      const queryParams: FilterDto = {
        filter: { status: 'SCHEDULED' },
        paginate: true,
        per_page: 10,
        current_page: 1,
      };

      await service.findByClient(clientId, queryParams);

      expect(mockFindAll).toHaveBeenCalledWith(
        mockRepository,
        expect.objectContaining({
          paginate: true,
          per_page: 10,
          current_page: 1,
          filter: expect.objectContaining({ clientId: '5' }),
        }),
        'mr',
      );
    });
  });

  // ─── Cenário 4: Retorno paginado ───────────────────────────────────────────
  describe('quando paginação está ativa', () => {
    it('deve retornar estrutura IPaginate com pagination e data', async () => {
      const clientId = 2;
      const records = makeMedicalRecordList(clientId, 2);
      const paginatedResponse = {
        pagination: { current_page: 1, per_page: 5, total: 2 },
        data: records,
      };
      mockFindAll.mockResolvedValueOnce(paginatedResponse);

      const result = (await service.findByClient(clientId, {
        paginate: true,
        per_page: 5,
      })) as any;

      expect(result.pagination).toBeDefined();
      expect(result.pagination.total).toBe(2);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].clientId).toBe(clientId);
    });
  });

  // ─── Cenário 5: Erro interno lança BadRequestException ────────────────────
  describe('quando ocorre erro interno', () => {
    it('deve lançar BadRequestException com mensagem em PT-BR', async () => {
      mockFindAll.mockRejectedValue(new Error('DB connection failed'));

      await expect(service.findByClient(1, {})).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.findByClient(1, {})).rejects.toThrow(
        'Ocorreu um erro ao buscar os prontuários do cliente.',
      );

      mockFindAll.mockReset();
    });
  });

  // ─── Cenário 6: clientId é sempre convertido para String no filter ─────────
  describe('conversão do clientId', () => {
    it('deve converter clientId number para string no filter', async () => {
      mockFindAll.mockResolvedValueOnce([]);

      await service.findByClient(42, {});

      const callArgs = mockFindAll.mock.calls[0][1] as FilterDto;
      expect(callArgs.filter['clientId']).toBe('42');
      expect(typeof callArgs.filter['clientId']).toBe('string');
    });
  });
});

describe('MedicalRecordService — remove (soft cancel)', () => {
  let service: MedicalRecordService;

  beforeEach(async () => {
    service = await createServiceModule();
    jest.clearAllMocks();
  });

  it('deve marcar prontuário como canceled e cancelar agendamentos ativos', async () => {
    mockRepository.findOne.mockResolvedValueOnce(
      makeMedicalRecord({ id: 10, status: MedicalRecordStatusEnum.PENDING }),
    );
    mockDataSource.transaction.mockImplementation(async (cb) =>
      cb(mockDataSource.manager),
    );

    const result = await service.remove(10);

    expect(mockDataSource.manager.update).toHaveBeenCalledWith(
      MedicalRecord,
      10,
      { status: MedicalRecordStatusEnum.CANCELED },
    );
    expect(mockDataSource.manager.update).toHaveBeenCalledWith(
      Appointment,
      expect.objectContaining({ medicalRecordId: 10 }),
      {
        status: AppointmentStatusEnum.CANCELED,
        canceledBy: AppointmentCanceledByEnum.ADMIN,
      },
    );
    expect(result).toEqual({ success: true, id: 10 });
  });

  it('não altera novamente se já estiver canceled', async () => {
    mockRepository.findOne.mockResolvedValueOnce(
      makeMedicalRecord({ id: 11, status: MedicalRecordStatusEnum.CANCELED }),
    );

    const result = await service.remove(11);

    expect(mockDataSource.transaction).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true, id: 11 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('MedicalRecordController — GET /v1/medical-records/client/:clientId', () => {
  let service: MedicalRecordService;

  beforeEach(async () => {
    service = await createServiceModule();
    jest.clearAllMocks();
  });

  it('deve chamar findByClient com o clientId correto', async () => {
    const clientId = 10;
    const records = makeMedicalRecordList(clientId, 2);
    mockFindAll.mockResolvedValueOnce(records);

    const result = await service.findByClient(clientId, {});

    expect(mockFindAll).toHaveBeenCalledTimes(1);
    expect(mockFindAll).toHaveBeenCalledWith(
      mockRepository,
      expect.objectContaining({
        filter: { clientId: String(clientId) },
      }),
      'mr',
    );
    expect(result).toHaveLength(2);
  });

  it('deve retornar prontuários apenas do cliente solicitado', async () => {
    const clientId = 7;
    const records = [
      makeMedicalRecord({ id: 1, clientId }),
      makeMedicalRecord({ id: 2, clientId }),
    ];
    mockFindAll.mockResolvedValueOnce(records);

    const result = (await service.findByClient(clientId, {})) as MedicalRecord[];

    result.forEach((record) => {
      expect(record.clientId).toBe(clientId);
    });
  });
});
