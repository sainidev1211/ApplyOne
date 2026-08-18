import { AdminUsersService } from './admin-users.service';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateUserDashboardDto } from '../dto/update-dashboard-metrics.dto';

describe('AdminUsersService dashboard metrics', () => {
  const makeUser = () => ({
    dashboardData: {
      dashboardMetrics: {
        applications: '150+',
        responses: '37 🎯',
        interviews: 'Interviewing',
        offers: 'Application process is going well 🚀',
        rejected: '—',
        shortlisted: 'Excellent!',
      },
      applications: [],
      currentPlan: 'Professional',
    },
    notifications: [],
    save: jest.fn().mockResolvedValue(undefined),
  });

  it('merges one admin metric and leaves all other metrics intact through application updates', async () => {
    const user = makeUser();
    const userModel = { findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(user) }) };
    const service = new AdminUsersService(userModel as any, {} as any, {} as any, {} as any);

    await service.updateUserDashboard('user-1', { dashboardMetrics: { responses: '37 🎯' } });
    expect(user.dashboardData.dashboardMetrics).toEqual({
      applications: '150+', responses: '37 🎯', interviews: 'Interviewing', offers: 'Application process is going well 🚀', rejected: '—', shortlisted: 'Excellent!',
    });

    await service.createApplication('user-1', {
      jobTitle: 'Engineer', company: 'Example', status: 'Applied',
    });
    expect(user.dashboardData.dashboardMetrics).toEqual({
      applications: '150+', responses: '37 🎯', interviews: 'Interviewing', offers: 'Application process is going well 🚀', rejected: '—', shortlisted: 'Excellent!',
    });
  });

  it('stores a newly submitted numeric value as text without changing legacy values', async () => {
    const user = makeUser();
    const userModel = { findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(user) }) };
    const service = new AdminUsersService(userModel as any, {} as any, {} as any, {} as any);

    await service.updateUserDashboard('user-1', { dashboardMetrics: { applications: 150 } });
    expect(user.dashboardData.dashboardMetrics.applications).toBe('150');
    expect(user.dashboardData.dashboardMetrics.responses).toBe('37 🎯');
  });

  it('validates the complete PUT/PATCH dashboard payload without allowing unknown fields', async () => {
    const payload = plainToInstance(UpdateUserDashboardDto, {
      currentPlan: 'Professional',
      remainingCredits: { job: 10, ai: 5, resume: 3, ats: 5 },
      jobsInProgress: 4,
      adminMessage: 'Application process is going well 🚀',
      dashboardMetrics: {
        applications: '150+', responses: '37 🎯', interviews: 'Interviewing',
        offers: 'Application process is going well 🚀', rejected: '—', shortlisted: 'Excellent!',
      },
    });
    expect(await validate(payload, { whitelist: true, forbidNonWhitelisted: true })).toHaveLength(0);

    const legacyNumericMetric = plainToInstance(UpdateUserDashboardDto, {
      dashboardMetrics: { applications: 150 },
    });
    expect(await validate(legacyNumericMetric, { whitelist: true, forbidNonWhitelisted: true })).toHaveLength(0);
  });
});
