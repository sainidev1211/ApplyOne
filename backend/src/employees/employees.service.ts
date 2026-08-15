import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ApplicationStatus } from '@prisma/client';
import { UpdateTaskStatusDto } from './dto/employee.dto.js';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async getTasks(userId: string) {
    const employee = await this.getEmployeeProfile(userId);

    const tasks = await this.prisma.application.findMany({
      where: { assignedEmployeeId: employee.id },
      include: { job: { include: { company: true } }, user: true },
      orderBy: { updatedAt: 'desc' },
    });

    const pending = tasks.filter(
      (t: any) =>
        t.status === ApplicationStatus.ASSIGNED ||
        t.status === ApplicationStatus.PENDING,
    );
    const inProgress = tasks.filter(
      (t: any) => t.status === ApplicationStatus.APPLYING,
    );
    const completed = tasks.filter((t: any) =>
      [
        ApplicationStatus.APPLIED,
        ApplicationStatus.INTERVIEW,
        ApplicationStatus.REJECTED,
      ].includes(t.status),
    );

    return { pending, inProgress, completed };
  }

  async getTasksToday(userId: string) {
    const employee = await this.getEmployeeProfile(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.application.findMany({
      where: {
        assignedEmployeeId: employee.id,
        updatedAt: { gte: today },
      },
      include: { job: { include: { company: true } }, user: true },
    });
  }

  async updateTaskStatus(
    userId: string,
    id: string,
    data: UpdateTaskStatusDto,
  ) {
    const employee = await this.getEmployeeProfile(userId);

    const application = await this.prisma.application.findUnique({
      where: { id },
    });
    if (!application || application.assignedEmployeeId !== employee.id) {
      throw new ForbiddenException('Task not found or not assigned to you');
    }

    const updated = await this.prisma.application.update({
      where: { id },
      data: { status: data.status },
    });

    await this.prisma.applicationTimeline.create({
      data: {
        applicationId: id,
        status: data.status,
        description:
          data.description || `Task status updated to ${data.status}`,
        createdById: userId,
      },
    });

    return updated;
  }

  async markTaskComplete(userId: string, id: string) {
    return this.updateTaskStatus(userId, id, {
      status: ApplicationStatus.APPLIED,
      description: 'Application marked as complete by employee',
    });
  }

  private async getEmployeeProfile(userId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
    });
    if (!employee || employee.status !== 'ACTIVE') {
      throw new ForbiddenException('Active employee profile not found');
    }
    return employee;
  }
}
