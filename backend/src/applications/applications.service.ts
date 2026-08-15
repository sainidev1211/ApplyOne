import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ActivityLoggerService } from '../common/services/activity-logger.service.js';
import {
  CreateApplicationDto,
  AssignEmployeeDto,
  UpdateStatusDto,
  AddNoteDto,
  ApplicationQueryDto,
} from './dto/application.dto.js';
import { UserRole, ApplicationStatus, Prisma } from '@prisma/client';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogger: ActivityLoggerService,
  ) {}

  async create(userId: string, data: CreateApplicationDto) {
    const job = await this.prisma.job.findUnique({ where: { id: data.jobId } });
    if (!job) throw new NotFoundException('Job not found');

    const activeResume = data.resumeId
      ? await this.prisma.resume.findUnique({
          where: { id: data.resumeId, userId },
        })
      : await this.prisma.resume.findFirst({
          where: { userId, isDefault: true },
        });

    if (!activeResume) {
      throw new BadRequestException(
        'A resume is required to apply. Please upload one or specify resumeId.',
      );
    }

    const existing = await this.prisma.application.findFirst({
      where: { userId, jobId: data.jobId },
    });

    if (existing) {
      throw new BadRequestException('You have already applied for this job.');
    }

    const application = await this.prisma.application.create({
      data: {
        userId,
        jobId: data.jobId,
        resumeId: activeResume.id,
        status: ApplicationStatus.PENDING,
      },
    });

    await this.prisma.applicationTimeline.create({
      data: {
        applicationId: application.id,
        status: ApplicationStatus.PENDING,
        description: 'Application requested by user',
      },
    });

    await this.activityLogger.log(
      userId,
      'APPLICATION_CREATED',
      'applications',
      `Applied for job ${job.title}`,
    );

    return application;
  }

  async findAll(user: any, query: ApplicationQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ApplicationWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.companyId && { job: { companyId: query.companyId } }),
    };

    if (user.role === UserRole.USER) {
      where.userId = user.id;
    } else if (user.role === UserRole.EMPLOYEE) {
      const emp = await this.prisma.employee.findUnique({
        where: { userId: user.id },
      });
      if (emp) where.assignedEmployeeId = emp.id;
    }

    const [items, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        skip,
        take: limit,
        include: {
          job: { include: { company: true } },
          user: true,
          assignedEmployee: { include: { user: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.application.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, user: any) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        job: { include: { company: true } },
        user: true,
        assignedEmployee: { include: { user: true } },
        timeline: { orderBy: { createdAt: 'desc' } },
        resume: true,
      },
    });

    if (!application) throw new NotFoundException('Application not found');

    if (user.role === UserRole.USER && application.userId !== user.id) {
      throw new ForbiddenException('Access denied');
    }
    if (
      user.role === UserRole.EMPLOYEE &&
      application.assignedEmployee?.userId !== user.id
    ) {
      throw new ForbiddenException('Access denied');
    }

    return application;
  }

  async assignEmployee(id: string, data: AssignEmployeeDto, adminId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
    });
    if (!application) throw new NotFoundException('Application not found');

    const employee = await this.prisma.employee.findUnique({
      where: { id: data.employeeId },
    });
    if (!employee || employee.status !== 'ACTIVE') {
      throw new BadRequestException('Invalid or inactive employee');
    }

    const updated = await this.prisma.application.update({
      where: { id },
      data: {
        assignedEmployeeId: employee.id,
        status: ApplicationStatus.ASSIGNED,
      },
    });

    await this.prisma.applicationTimeline.create({
      data: {
        applicationId: id,
        status: ApplicationStatus.ASSIGNED,
        description: `Assigned to employee ${employee.employeeCode}`,
        createdById: adminId,
      },
    });

    await this.activityLogger.log(
      adminId,
      'EMPLOYEE_ASSIGNED',
      'applications',
      `Assigned application ${id} to ${employee.employeeCode}`,
    );

    return updated;
  }

  async updateStatus(id: string, data: UpdateStatusDto, actorId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
    });
    if (!application) throw new NotFoundException('Application not found');

    const updated = await this.prisma.application.update({
      where: { id },
      data: { status: data.status },
    });

    await this.prisma.applicationTimeline.create({
      data: {
        applicationId: id,
        status: data.status,
        description: data.description || `Status updated to ${data.status}`,
        createdById: actorId,
      },
    });

    return updated;
  }

  async addNote(id: string, data: AddNoteDto, actorId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
    });
    if (!application) throw new NotFoundException('Application not found');

    const previousNotes = application.notes ? application.notes + '\n\n' : '';
    const newNote = `[${new Date().toISOString()}] Note added:\n${data.note}`;

    return this.prisma.application.update({
      where: { id },
      data: { notes: previousNotes + newNote },
    });
  }

  async getHistory(id: string, user: any) {
    const app = await this.findOne(id, user); // re-use auth check
    return app.timeline;
  }

  async remove(id: string, user: any) {
    const application = await this.prisma.application.findUnique({
      where: { id },
    });
    if (!application) throw new NotFoundException('Application not found');

    if (user.role === UserRole.USER && application.userId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.application.update({
      where: { id },
      data: { status: ApplicationStatus.CANCELLED },
    });
  }
}
