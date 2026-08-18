import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto.js';
import { Plan, PlanDocument } from './schemas/plan.schema.js';
import { PrismaService } from '../database/prisma.service.js';

const DEFAULT_PUBLIC_PLANS = [
  {
    id: 'professional',
    slug: 'professional',
    name: 'Professional',
    description: 'Essential matching and dispatch tools to jumpstart your applications.',
    monthlyPrice: 999,
    yearlyPrice: 10990,
    currency: 'INR',
    jobCredits: 10,
    aiCredits: 0,
    resumeCredits: 0,
    atsCredits: 0,
    features: ['10 daily job matches', '10 credits/month', '50-60 applications/month'],
    status: 'ACTIVE',
    displayOrder: 1,
  },
  {
    id: 'premium',
    slug: 'premium',
    name: 'Premium',
    description: 'Perfect for active job candidates hunting for multiple interview invites.',
    monthlyPrice: 1299,
    yearlyPrice: 13990,
    currency: 'INR',
    jobCredits: 20,
    aiCredits: 0,
    resumeCredits: 0,
    atsCredits: 1,
    features: ['15 daily job matches', '20 credits/month', '80-100 applications/month', 'ATS Score Checker'],
    status: 'ACTIVE',
    displayOrder: 2,
  },
  {
    id: 'elite',
    slug: 'elite',
    name: 'Elite',
    description: 'Advanced automation features designed for rapid placement campaigns.',
    monthlyPrice: 1499,
    yearlyPrice: 15990,
    currency: 'INR',
    jobCredits: 30,
    aiCredits: 0,
    resumeCredits: 0,
    atsCredits: 1,
    features: ['25 daily job matches', '30 credits/month', '150 applications/month', 'ATS Score Checker'],
    status: 'ACTIVE',
    displayOrder: 3,
  },
];

@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);
  constructor(
    @InjectModel(Plan.name) private planModel: Model<PlanDocument>,
    private readonly prisma: PrismaService,
  ) {}

  private async ensureSeeded() {
    // Always upsert DEFAULT_PUBLIC_PLANS to ensure prices are up-to-date
    for (const plan of DEFAULT_PUBLIC_PLANS) {
      await this.planModel.findOneAndUpdate(
        { id: plan.id },
        { $set: { ...plan } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }

    const count = await this.planModel.countDocuments();
    if (count > DEFAULT_PUBLIC_PLANS.length) return;

    try {
      const pgPlans = await this.prisma.subscriptionPlan.findMany();
      for (const p of pgPlans) {
        const exists = await this.planModel.findOne({ id: p.id }).lean();
        if (exists) continue;
        await this.planModel.create({
          id: p.id,
          slug: p.slug,
          name: p.name,
          description: p.description as any,
          monthlyPrice: Number(p.monthlyPrice),
          yearlyPrice: p.yearlyPrice ? Number(p.yearlyPrice) : undefined,
          currency: p.currency,
          jobCredits: p.jobCredits,
          aiCredits: p.aiCredits,
          resumeCredits: p.resumeCredits,
          atsCredits: p.atsCredits,
          features: p.features as any,
          status: p.status,
          displayOrder: p.displayOrder,
        } as any);
      }
    } catch (e: any) {
      this.logger.warn('Failed to seed plans from Postgres', e?.message || e);
    }
  }

  async getPublicPlans() {
    await this.ensureSeeded();
    return this.planModel.find({ status: 'ACTIVE' }).sort({ displayOrder: 1 }).lean();
  }

  async getAllPlans() {
    await this.ensureSeeded();
    return this.planModel.find().sort({ displayOrder: 1 }).lean();
  }

  async getPlanById(id: string) {
    await this.ensureSeeded();
    const plan = await this.planModel.findOne({ id }).lean();
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async createPlan(dto: CreatePlanDto) {
    const existing = await this.planModel.findOne({ slug: dto.slug }).lean();
    if (existing) throw new BadRequestException('Plan with this slug already exists');
    return this.planModel.create(dto as any);
  }

  async updatePlan(id: string, dto: Partial<UpdatePlanDto>) {
    await this.getPlanById(id);
    return this.planModel.findOneAndUpdate({ id }, dto, { new: true }).lean();
  }

  async togglePlanStatus(id: string, status: string) {
    await this.getPlanById(id);
    return this.planModel.findOneAndUpdate({ id }, { status }, { new: true }).lean();
  }

  async getPlanComparison() {
    const plans = await this.getPublicPlans();
    return {
      features: plans.map((p: any) => p.features),
      limits: plans.map((p: any) => ({
        name: p.name,
        aiCredits: p.aiCredits,
        resumeCredits: p.resumeCredits,
        jobCredits: p.jobCredits,
        atsCredits: p.atsCredits,
        maxApplications: p.maxApplications,
      })),
      pricing: plans.map((p: any) => ({ name: p.name, monthly: p.monthlyPrice, yearly: p.yearlyPrice })),
    };
  }
}
