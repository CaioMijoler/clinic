import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { MedicalRecordService } from '@modules/medical-record/medical-record.service';
import { MedicalRecord } from '@modules/medical-record/entities/medical-record.entity';
import { FilterDto } from '@app/utils/filter-dto';
import * as queryBuilderUtil from '@app/utils/query-builder';
import {
  makeMedicalRecord,
  makeMedicalRecordList,
} from '@test/medical-record/medical-record.factory';

// ─── Mock do findAllWithQueryBuilder ─────────────────────────────────────────
jest.mock('@app/utils/query-builder', () => ({
  findAllWithQueryBuilder: jest.fn(),
}));

const mockFindAll = queryBuilderUtil.findAllWithQueryBuilder as jest.Mock;

// ─── Mock do Repository ───────────────────────────────────────────────────────
const mockRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  createQueryBuilder: jest.fn(),
};

// ─── Mock do DataSource ───────────────────────────────────────────────────────
const mockDataSource = {
  transaction: jest.fn(),
  manager: {
    findOne: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    merge: jest.fn(),
    remove: jest.fn(),
  },
};

// ─────────────────────────────────────────────────────────────────────────────

describe('MedicalRecordService — findByClient', () => {
  let service: MedicalRecordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicalRecordService,
        {
          provide: getRepositoryToken(MedicalRecord),
          useValue: mockRepository,
        },
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<MedicalRecordService>(MedicalRecordService);
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
      expect(result).toEqual(records);
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

// ─────────────────────────────────────────────────────────────────────────────

describe('MedicalRecordController — GET /v1/medical-records/client/:clientId', () => {
  let service: MedicalRecordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicalRecordService,
        {
          provide: getRepositoryToken(MedicalRecord),
          useValue: mockRepository,
        },
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<MedicalRecordService>(MedicalRecordService);
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
