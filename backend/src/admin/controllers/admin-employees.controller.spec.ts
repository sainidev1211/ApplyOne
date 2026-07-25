import { Test, TestingModule } from '@nestjs/testing';
import { AdminEmployeesController } from './admin-employees.controller';

describe('AdminEmployeesController', () => {
  let controller: AdminEmployeesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminEmployeesController],
    }).compile();

    controller = module.get<AdminEmployeesController>(AdminEmployeesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
