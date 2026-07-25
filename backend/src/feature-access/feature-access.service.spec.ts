import { Test, TestingModule } from '@nestjs/testing';
import { FeatureAccessService } from './feature-access.service';

describe('FeatureAccessService', () => {
  let service: FeatureAccessService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FeatureAccessService],
    }).compile();

    service = module.get<FeatureAccessService>(FeatureAccessService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
