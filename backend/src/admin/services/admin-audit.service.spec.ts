import { Test, TestingModule } from '@nestjs/testing';
import { AdminAuditService } from './admin-audit.service';

describe('AdminAuditService', () => {
  let service: AdminAuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminAuditService],
    }).compile();

    service = module.get<AdminAuditService>(AdminAuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
