import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto.js';
import { PlanStatus, Prisma } from '@prisma/client';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { status: PlanStatus.ACTIVE },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async getAllPlans() {
    return this.prisma.subscriptionPlan.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  }

  async getPlanById(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async createPlan(dto: CreatePlanDto) {
    const existing = await this.prisma.subscriptionPlan.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new BadRequestException('Plan with this slug already exists');

    return this.prisma.subscriptionPlan.create({
      data: dto as Prisma.SubscriptionPlanCreateInput,
    });
  }

  async updatePlan(id: string, dto: Partial<UpdatePlanDto>) {
    await this.getPlanById(id);
    return this.prisma.subscriptionPlan.update({
      where: { id },
      data: dto as Prisma.SubscriptionPlanUpdateInput,
    });
  }

  async togglePlanStatus(id: string, status: PlanStatus) {
    await this.getPlanById(id);
    return this.prisma.subscriptionPlan.update({
      where: { id },
      data: { status },
    });
  }

  async getPlanComparison() {
    const plans = await this.getPublicPlans();
    return {
      features: plans.map(p => p.features),
      limits: plans.map(p => ({
        name: p.name,
        aiCredits: p.aiCredits,
        resumeCredits: p.resumeCredits,
        jobCredits: p.jobCredits,
        atsCredits: p.atsCredits,
        maxApplications: p.maxApplications
      })),
      pricing: plans.map(p => ({
        name: p.name,
        monthly: p.monthlyPrice,
        yearly: p.yearlyPrice
      })),
    };
  }
}
