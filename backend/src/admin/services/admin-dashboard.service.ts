import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { ApplicationStatus, UserRole } from '@prisma/client';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      totalEmployees,
      totalAdmins,
      totalCompanies,
      totalJobs,
      applicationsToday,
      applicationsThisWeek,
      pendingApps,
      assignedApps,
      completedApps,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { role: UserRole.EMPLOYEE } }),
      this.prisma.user.count({ where: { role: UserRole.ADMIN } }),
      this.prisma.company.count(),
      this.prisma.job.count(),
      this.prisma.application.count({ where: { createdAt: { gte: today } } }),
      this.prisma.application.count({ where: { createdAt: { gte: startOfWeek } } }),
      this.prisma.application.count({ where: { status: ApplicationStatus.PENDING } }),
      this.prisma.application.count({ where: { status: ApplicationStatus.ASSIGNED } }),
      this.prisma.application.count({ where: { status: ApplicationStatus.APPLIED } }),
    ]);

    return {
      users: { totalUsers, activeUsers, totalEmployees, totalAdmins },
      content: { totalCompanies, totalJobs },
      applications: {
        applicationsToday,
        applicationsThisWeek,
        pendingApps,
        assignedApps,
        completedApps,
      }
    };
  }
}
