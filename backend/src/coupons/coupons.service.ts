import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto } from './dto/coupon.dto.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllCoupons() {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCouponById(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }

  async createCoupon(dto: CreateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({ where: { code: dto.code } });
    if (existing) throw new BadRequestException('Coupon code already exists');

    return this.prisma.coupon.create({
      data: {
        ...dto,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      } as Prisma.CouponCreateInput,
    });
  }

  async updateCoupon(id: string, dto: Partial<UpdateCouponDto>) {
    await this.getCouponById(id);
    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...dto,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      } as Prisma.CouponUpdateInput,
    });
  }

  async deleteCoupon(id: string) {
    await this.getCouponById(id);
    return this.prisma.coupon.delete({ where: { id } });
  }

  async validateCoupon(userId: string, dto: ValidateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: dto.code } });
    
    if (!coupon) throw new NotFoundException('Invalid coupon code');
    if (!coupon.isActive) throw new BadRequestException('Coupon is no longer active');
    
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      throw new BadRequestException('Coupon has expired');
    }

    if (coupon.maxUsage && coupon.usageCount >= coupon.maxUsage) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    if (coupon.minimumAmount && dto.amount < Number(coupon.minimumAmount)) {
      throw new BadRequestException(`Minimum amount of ${coupon.minimumAmount} required`);
    }

    if (coupon.applicablePlans && coupon.applicablePlans.length > 0 && !coupon.applicablePlans.includes(dto.planId)) {
      throw new BadRequestException('Coupon is not applicable for this plan');
    }

    const userUsage = await this.prisma.payment.count({
      where: { couponId: coupon.id, subscription: { userId } }
    });

    if (userUsage >= coupon.perUserLimit) {
      throw new BadRequestException('You have reached the maximum usage limit for this coupon');
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.percentageDiscount) {
      discountAmount = (dto.amount * Number(coupon.percentageDiscount)) / 100;
    } else if (coupon.fixedDiscount) {
      discountAmount = Number(coupon.fixedDiscount);
    }

    // Don't allow discount greater than amount
    discountAmount = Math.min(discountAmount, dto.amount);
    
    return {
      valid: true,
      couponId: coupon.id,
      discountAmount,
      finalAmount: dto.amount - discountAmount
    };
  }
}
