import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateJobDto, UpdateJobDto, JobSearchQueryDto } from './dto/job.dto.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateJobDto) {
    return this.prisma.job.create({
      data,
    });
  }

  async search(query: JobSearchQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.JobWhereInput = {
      status: 'ACTIVE',
      ...(query.company && { companyId: query.company }),
      ...(query.role && { title: { contains: query.role, mode: 'insensitive' } }),
      ...(query.location && { location: { contains: query.location, mode: 'insensitive' } }),
      ...(query.remoteMode && { remoteMode: query.remoteMode }),
    };

    const [items, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip,
        take: limit,
        include: { company: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAll(query: JobSearchQueryDto) {
    return this.search(query);
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    return job;
  }

  async update(id: string, data: UpdateJobDto) {
    await this.findOne(id);

    return this.prisma.job.update({
      where: { id },
      data: data as Prisma.JobUpdateInput,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.job.update({
      where: { id },
      data: { status: 'ARCHIVED' as any }, // Prisma schema uses EXPIRED/CLOSED
    });
  }
}
