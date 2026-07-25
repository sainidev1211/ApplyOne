import { Test, TestingModule } from '@nestjs/testing';
import { AdminEmployeesService } from './admin-employees.service';

describe('AdminEmployeesService', () => {
  let service: AdminEmployeesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminEmployeesService],
    }).compile();

    service = module.get<AdminEmployeesService>(AdminEmployeesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
