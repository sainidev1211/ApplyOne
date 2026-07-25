import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateEmployeeDto, UpdateEmployeeDto } from '../dto/admin.dto.js';
import { ApplicationStatus, Prisma, UserRole } from '@prisma/client';
import { PaginationQueryDto } from '../../users/dto/pagination-query.dto.js';

@Injectable()
export class AdminEmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.employee.findMany({
        skip,
        take: limit,
        include: { user: { select: { fullName: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.employee.count(),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        user: true,
        applications: {
          select: { status: true },
        },
      },
    });

    if (!employee) throw new NotFoundException('Employee not found');

    const totalApplications = employee.applications.length;
    const completed = employee.applications.filter(a => ([ApplicationStatus.APPLIED, ApplicationStatus.INTERVIEW, ApplicationStatus.OFFER, ApplicationStatus.REJECTED] as ApplicationStatus[]).includes(a.status)).length;
    const pending = employee.applications.filter(a => ([ApplicationStatus.PENDING, ApplicationStatus.ASSIGNED] as ApplicationStatus[]).includes(a.status)).length;

    return {
      ...employee,
      performance: {
        totalApplications,
        completed,
        pending,
        completionRate: totalApplications > 0 ? (completed / totalApplications) * 100 : 0,
      }
    };
  }

  async create(adminId: string, dto: CreateEmployeeDto) {
    const existing = await this.prisma.employee.findUnique({ where: { employeeCode: dto.employeeCode } });
    if (existing) throw new BadRequestException('Employee code already exists');

    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');

    const employee = await this.prisma.employee.create({
      data: {
        userId: dto.userId,
        employeeCode: dto.employeeCode,
        department: dto.department,
        designation: dto.designation,
      },
    });

    await this.prisma.user.update({
      where: { id: dto.userId },
      data: { role: UserRole.EMPLOYEE },
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        module: 'EMPLOYEES',
        action: 'CREATE_EMPLOYEE',
        targetId: employee.id,
        targetType: 'Employee',
        newValue: dto as unknown as Prisma.InputJsonValue,
      },
    });

    return employee;
  }

  async update(adminId: string, id: string, dto: UpdateEmployeeDto) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) throw new NotFoundException('Employee not found');

    const updated = await this.prisma.employee.update({
      where: { id },
      data: dto as Prisma.EmployeeUpdateInput,
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        module: 'EMPLOYEES',
        action: 'UPDATE_EMPLOYEE',
        targetId: id,
        targetType: 'Employee',
        newValue: dto as unknown as Prisma.InputJsonValue,
      },
    });

    return updated;
  }
}
