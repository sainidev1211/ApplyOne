import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../../users/schemas/user.schema.js';
import { Payment, PaymentDocument } from '../../payments/schemas/payment.schema.js';
import { Subscription, SubscriptionDocument } from '../../subscriptions/schemas/subscription.schema.js';
import { Plan, PlanDocument } from '../../plans/schemas/plan.schema.js';
import { PaginationQueryDto } from '../../users/dto/pagination-query.dto.js';
import { randomUUID } from 'crypto';

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(Subscription.name) private readonly subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Plan.name) private readonly planModel: Model<PlanDocument>,
  ) {}

  private async getBillingSnapshot(userIds: string[]) {
    const uniqueIds = [...new Set(userIds.filter(Boolean).map((id) => String(id)))];
    if (!uniqueIds.length) return new Map();

    const subscriptions = await this.subscriptionModel
      .find({ userId: { $in: uniqueIds } })
      .sort({ startDate: -1, createdAt: -1 })
      .lean()
      .exec();

    const payments = await this.paymentModel
      .find({ userId: { $in: uniqueIds } })
      .sort({ paidAt: -1, createdAt: -1 })
      .lean()
      .exec();

    const planIds = [...new Set((subscriptions || []).map((item: any) => item.planId).filter(Boolean))];
    const plans = await this.planModel.find({ id: { $in: planIds } }).lean().exec();

    const planMap = new Map((plans || []).map((plan: any) => [String(plan.id), plan]));
    const subMap = new Map();
    const paymentMap = new Map();

    for (const sub of subscriptions || []) {
      const key = String(sub.userId);
      if (!subMap.has(key)) subMap.set(key, sub);
    }

    for (const payment of payments || []) {
      const key = String(payment.userId);
      if (!paymentMap.has(key)) paymentMap.set(key, payment);
    }

    const snapshot = new Map();
    for (const userId of uniqueIds) {
      const subscription = subMap.get(userId) || null;
      const payment = paymentMap.get(userId) || null;
      const plan = subscription ? planMap.get(String(subscription.planId)) : null;

      snapshot.set(userId, {
        subscriptionInfo: {
          planName: plan?.name || subscription?.planId || 'Free',
          startDate: subscription?.startDate || null,
          expiresAt: subscription?.expiresAt || null,
          status: subscription?.status || 'TRIAL',
          autoRenew: subscription?.autoRenew ?? true,
          amount: payment?.amount ?? null,
          currency: payment?.currency || plan?.currency || 'INR',
        },
        paymentInfo: {
          status: payment?.status || 'NO_PAYMENT',
          amount: payment?.amount ?? null,
          currency: payment?.currency || plan?.currency || 'INR',
          paymentId: payment?.razorpayPaymentId || payment?.id || null,
          gatewayOrderId: payment?.razorpayOrderId || null,
          paidAt: payment?.paidAt || null,
          method: payment?.razorpayPaymentId ? 'RAZORPAY' : 'DB',
        },
      });
    }

    return snapshot;
  }

  async findAll(query: PaginationQueryDto & { accountType?: string; hasResume?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query.search?.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { email: searchRegex },
        { fullName: searchRegex },
        { phone: searchRegex },
        { companyName: searchRegex },
      ];
    }

    if (query.accountType && query.accountType !== 'ALL') {
      filter.accountType = query.accountType.toUpperCase();
    }

    if (query.hasResume === 'true') {
      filter.$or = [
        { resumeFileName: { $exists: true, $ne: '' } },
        { 'resumes.0': { $exists: true } },
      ];
    }

    const [items, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    const billingSnapshot = await this.getBillingSnapshot(
      items.map((u: any) => String(u._id || u.email)),
    );

    const formattedItems = items.map((u: any) => {
      const billing = billingSnapshot.get(String(u._id || u.email)) || {
        subscriptionInfo: { planName: u.dashboardData?.currentPlan || 'Free', startDate: null, expiresAt: null, status: 'TRIAL', autoRenew: true, amount: null, currency: 'INR' },
        paymentInfo: { status: 'NO_PAYMENT', amount: null, currency: 'INR', paymentId: null, gatewayOrderId: null, paidAt: null, method: 'DB' },
      };

      return {
        id: u._id || u.email,
        email: u.email,
        fullName: u.fullName,
        phone: u.phone || null,
        accountType: u.accountType || 'STUDENT',
        role: u.role || 'USER',
        hasExperience: u.hasExperience ?? false,
        companyName: u.companyName || null,
        roleDetails: u.roleDetails || null,
        employmentTypes: u.employmentTypes || [],
        expectedPackageFullTime: u.expectedPackageFullTime || null,
        lastMonthlyPackage: u.lastMonthlyPackage || null,
        resumeFileName: u.resumeFileName || (u.resumes?.[0]?.fileName ?? null),
        resumePath: u.resumePath || (u.resumes?.[0]?.storagePath ?? null),
        resumesCount: u.resumes?.length || (u.resumeFileName ? 1 : 0),
        isActive: u.isActive ?? true,
        isVerified: u.isVerified ?? false,
        dashboardData: u.dashboardData || {},
        notificationCount: u.notifications?.length || 0,
        subscriptionInfo: billing.subscriptionInfo,
        paymentInfo: billing.paymentInfo,
        notificationsCount: u.notifications?.length || 0,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        lastLoginAt: u.lastLoginAt || null,
      };
    });

    return {
      items: formattedItems,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).lean().exec();
    if (!user) {
      throw new NotFoundException(`User with ID or email "${id}" not found`);
    }

    const billingSnapshot = await this.getBillingSnapshot([String(user._id || user.email)]);
    const billing = billingSnapshot.get(String(user._id || user.email)) || {
      subscriptionInfo: { planName: user.dashboardData?.currentPlan || 'Free', startDate: null, expiresAt: null, status: 'TRIAL', autoRenew: true, amount: null, currency: 'INR' },
      paymentInfo: { status: 'NO_PAYMENT', amount: null, currency: 'INR', paymentId: null, gatewayOrderId: null, paidAt: null, method: 'DB' },
    };

    return {
      id: user._id || user.email,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone || null,
      accountType: user.accountType || 'STUDENT',
      role: user.role || 'USER',
      hasExperience: user.hasExperience ?? false,
      companyName: user.companyName || null,
      roleDetails: user.roleDetails || null,
      employmentTypes: user.employmentTypes || [],
      expectedPackageFullTime: user.expectedPackageFullTime || null,
      expectedPackagePartTime: user.expectedPackagePartTime || null,
      expectedPackageInternship: user.expectedPackageInternship || null,
      lastMonthlyPackage: user.lastMonthlyPackage || null,
      bio: user.bio || null,
      linkedinUrl: user.linkedinUrl || null,
      githubUrl: user.githubUrl || null,
      portfolioUrl: user.portfolioUrl || null,
      resumeFileName: user.resumeFileName || null,
      resumePath: user.resumePath || null,
      resumes: user.resumes || [],
      preferences: user.preferences || {},
      dashboardData: user.dashboardData || {
        currentPlan: 'Free',
        remainingCredits: { job: 10, ai: 5, resume: 3, ats: 5 },
        applicationsCount: 0,
        interviewCount: 0,
        offerCount: 0,
        jobsInProgress: 0,
        adminMessage: '',
      },
      notifications: user.notifications || [],
      subscriptionInfo: billing.subscriptionInfo,
      paymentInfo: billing.paymentInfo,
      adminNotes: user.adminNotes || '',
      isActive: user.isActive ?? true,
      isVerified: user.isVerified ?? false,
      createdAt: (user as any).createdAt,
      updatedAt: (user as any).updatedAt,
      lastLoginAt: user.lastLoginAt || null,
    };
  }

  async updateUser(id: string, data: Record<string, any>) {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    if (data.fullName !== undefined) user.fullName = data.fullName.trim();
    if (data.phone !== undefined) user.phone = data.phone?.trim() || undefined;
    if (data.accountType !== undefined) user.accountType = data.accountType;
    if (data.role !== undefined) user.role = data.role;
    if (data.hasExperience !== undefined) user.hasExperience = Boolean(data.hasExperience);
    if (data.companyName !== undefined) user.companyName = data.companyName?.trim() || undefined;
    if (data.roleDetails !== undefined) user.roleDetails = data.roleDetails?.trim() || undefined;
    if (data.employmentTypes !== undefined) user.employmentTypes = Array.isArray(data.employmentTypes) ? data.employmentTypes : [];
    if (data.expectedPackageFullTime !== undefined) user.expectedPackageFullTime = data.expectedPackageFullTime;
    if (data.expectedPackagePartTime !== undefined) user.expectedPackagePartTime = data.expectedPackagePartTime;
    if (data.expectedPackageInternship !== undefined) user.expectedPackageInternship = data.expectedPackageInternship;
    if (data.lastMonthlyPackage !== undefined) user.lastMonthlyPackage = data.lastMonthlyPackage;
    if (data.isActive !== undefined) user.isActive = Boolean(data.isActive);
    if (data.isVerified !== undefined) user.isVerified = Boolean(data.isVerified);
    if (data.adminNotes !== undefined) user.adminNotes = data.adminNotes;
    if (data.bio !== undefined) user.bio = data.bio;
    if (data.linkedinUrl !== undefined) user.linkedinUrl = data.linkedinUrl;
    if (data.githubUrl !== undefined) user.githubUrl = data.githubUrl;
    if (data.portfolioUrl !== undefined) user.portfolioUrl = data.portfolioUrl;

    if (data.newPassword && data.newPassword.length >= 8) {
      user.passwordHash = await bcrypt.hash(data.newPassword, 12);
    }

    await user.save();
    this.logger.log(`Admin updated user ${id}`);
    return this.findOne(id);
  }

  async updateUserDashboard(id: string, dashboardData: Record<string, any>) {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    user.dashboardData = {
      ...(user.dashboardData || {}),
      ...dashboardData,
      updatedAt: new Date(),
    };

    await user.save();
    this.logger.log(`Admin pushed dashboard update for user ${id}`);
    return {
      success: true,
      message: 'User dashboard updated successfully',
      dashboardData: user.dashboardData,
    };
  }

  async sendUserNotification(
    userId: string,
    notification: { title: string; message: string; type?: string; link?: string },
  ) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    const newNotification = {
      id: randomUUID(),
      title: notification.title,
      message: notification.message,
      type: notification.type || 'INFO',
      link: notification.link || null,
      read: false,
      createdAt: new Date(),
    };

    if (!user.notifications) user.notifications = [];
    user.notifications.unshift(newNotification);

    await user.save();
    this.logger.log(`Sent notification to user ${userId}: "${notification.title}"`);
    return { success: true, notification: newNotification };
  }

  async broadcastNotification(notification: {
    title: string;
    message: string;
    type?: string;
    link?: string;
  }) {
    const newNotification = {
      id: randomUUID(),
      title: notification.title,
      message: notification.message,
      type: notification.type || 'ANNOUNCEMENT',
      link: notification.link || null,
      read: false,
      createdAt: new Date(),
    };

    const users = await this.userModel.find({ isActive: true }).exec();
    for (const user of users) {
      user.notifications = user.notifications || [];
      user.notifications.unshift(newNotification);
      await user.save();
    }

    return {
      success: true,
      message: `Broadcast sent to ${users.length} active users`,
      notification: newNotification,
    };
  }

  async deleteUser(id: string) {
    const deleted = await this.userModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return {
      success: true,
      message: `User ${id} deleted successfully`,
    };
  }

  async seedDefaultAdmin() {
    const email = 'admin@applyone.co';
    const passwordHash = await bcrypt.hash('Admin@ApplyOne2026!', 12);

    const existing = await this.userModel.findOne({ email }).exec();
    if (existing) {
      return { success: true, message: 'Admin already exists', user: { email } };
    }

    await this.userModel.create({
      email,
      fullName: 'ApplyOne Admin',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
      isVerified: true,
      accountType: 'PROFESSIONAL',
    });

    return { success: true, message: 'Default admin seeded', user: { email } };
  }
}
