import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthCheckResult, HealthCheckService } from '@nestjs/terminus';
import { HealthModule } from './health.module';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: HealthCheckService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HealthModule],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health check result', async () => {
    const expectedResult: HealthCheckResult = {
      status: "ok",
      info: {
        database: {
          status: "up"
        }
      },
      error: {},
      details: {
        database: {
          status: "up"
        }
      }
    };

    jest.spyOn(healthCheckService, 'check').mockResolvedValue(expectedResult);

    const response = await controller.check();

    expect(response).toEqual(expectedResult);
  });
});
