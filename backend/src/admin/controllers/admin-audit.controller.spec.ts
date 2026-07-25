import { Test, TestingModule } from '@nestjs/testing';
import { AdminAuditController } from './admin-audit.controller';

describe('AdminAuditController', () => {
  let controller: AdminAuditController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminAuditController],
    }).compile();

    controller = module.get<AdminAuditController>(AdminAuditController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
