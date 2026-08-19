import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../../users/schemas/user.schema.js';
import { Payment, PaymentDocument } from '../../payments/schemas/payment.schema.js';
import {
  Subscription,
  SubscriptionDocument,
} from '../../subscriptions/schemas/subscription.schema.js';
import { Plan, PlanDocument } from '../../plans/schemas/plan.schema.js';
import { PaginationQueryDto } from '../../users/dto/pagination-query.dto.js';
import { randomUUID } from 'crypto';
import { UpdateUserDashboardDto } from '../dto/update-dashboard-metrics.dto.js';
import {
  isProtectedAdminAccount,
  PROTECTED_ADMIN_EMAIL,
} from '../../auth/constants/protected-admin.js';

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,

    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,

    @InjectModel(Plan.name)
    private readonly planModel: Model<PlanDocument>,
  ) {}

  private assertNotProtectedAdmin(user: Pick<User, 'email'>): void {
    if (isProtectedAdminAccount(user)) {
      throw new ForbiddenException(
        'The ApplyOne Executive Admin account is protected from candidate management actions.',
      );
    }
  }

  private async getBillingSnapshot(userIds: string[]) {
    const uniqueIds = [
      ...new Set(userIds.filter(Boolean).map((id) => String(id))),
    ];

    if (!uniqueIds.length) {
      return new Map();
    }

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

    const planIds = [
      ...new Set(
        (subscriptions || [])
          .map((item: any) => item.planId)
          .filter(Boolean),
      ),
    ];

    const plans = await this.planModel
      .find({ id: { $in: planIds } })
      .lean()
      .exec();

    const planMap = new Map(
      (plans || []).map((plan: any) => [String(plan.id), plan]),
    );

    const subMap = new Map();
    const paymentMap = new Map();

    for (const sub of subscriptions || []) {
      const key = String(sub.userId);

      if (!subMap.has(key)) {
        subMap.set(key, sub);
      }
    }

    for (const payment of payments || []) {
      const key = String(payment.userId);

      if (!paymentMap.has(key)) {
        paymentMap.set(key, payment);
      }
    }

    const snapshot = new Map();

    for (const userId of uniqueIds) {
      const subscription = subMap.get(userId) || null;
      const payment = paymentMap.get(userId) || null;

      const plan = subscription
        ? planMap.get(String(subscription.planId))
        : null;

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
          paymentId:
            payment?.razorpayPaymentId || payment?.id || null,
          gatewayOrderId: payment?.razorpayOrderId || null,
          paidAt: payment?.paidAt || null,
          method: payment?.razorpayPaymentId ? 'RAZORPAY' : 'DB',
        },
      });
    }

    return snapshot;
  }

  async findAll(
    query: PaginationQueryDto & {
      accountType?: string;
      hasResume?: string;
    },
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(
      1,
      Math.min(100, Number(query.limit) || 20),
    );

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
        {
          resumeFileName: {
            $exists: true,
            $ne: '',
          },
        },
        {
          'resumes.0': {
            $exists: true,
          },
        },
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
      const billing =
        billingSnapshot.get(String(u._id || u.email)) || {
          subscriptionInfo: {
            planName: u.dashboardData?.currentPlan || 'Free',
            startDate: null,
            expiresAt: null,
            status: 'TRIAL',
            autoRenew: true,
            amount: null,
            currency: 'INR',
          },

          paymentInfo: {
            status: 'NO_PAYMENT',
            amount: null,
            currency: 'INR',
            paymentId: null,
            gatewayOrderId: null,
            paidAt: null,
            method: 'DB',
          },
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

        expectedPackageFullTime:
          u.expectedPackageFullTime || null,

        lastMonthlyPackage:
          u.lastMonthlyPackage || null,

        resumeFileName:
          u.resumeFileName ||
          (u.resumes?.[0]?.fileName ?? null),

        resumePath:
          u.resumePath ||
          (u.resumes?.[0]?.storagePath ?? null),

        resumesCount:
          u.resumes?.length ||
          (u.resumeFileName ? 1 : 0),

        isActive: u.isActive ?? true,
        isVerified: u.isVerified ?? false,

        dashboardData: u.dashboardData || {},

        notificationCount:
          u.notifications?.length || 0,

        subscriptionInfo: billing.subscriptionInfo,

        paymentInfo: billing.paymentInfo,

        notificationsCount:
          u.notifications?.length || 0,

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
    const user = await this.userModel
      .findById(id)
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException(
        `User with ID or email "${id}" not found`,
      );
    }

    const billingSnapshot = await this.getBillingSnapshot([
      String(user._id || user.email),
    ]);

    const billing =
      billingSnapshot.get(String(user._id || user.email)) || {
        subscriptionInfo: {
          planName: user.dashboardData?.currentPlan || 'Free',
          startDate: null,
          expiresAt: null,
          status: 'TRIAL',
          autoRenew: true,
          amount: null,
          currency: 'INR',
        },

        paymentInfo: {
          status: 'NO_PAYMENT',
          amount: null,
          currency: 'INR',
          paymentId: null,
          gatewayOrderId: null,
          paidAt: null,
          method: 'DB',
        },
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

      expectedPackageFullTime:
        user.expectedPackageFullTime || null,

      expectedPackagePartTime:
        user.expectedPackagePartTime || null,

      expectedPackageInternship:
        user.expectedPackageInternship || null,

      lastMonthlyPackage:
        user.lastMonthlyPackage || null,

      bio: user.bio || null,

      linkedinUrl: user.linkedinUrl || null,
      githubUrl: user.githubUrl || null,
      portfolioUrl: user.portfolioUrl || null,

      resumeFileName:
        user.resumeFileName || null,

      resumePath:
        user.resumePath || null,

      resumes: (user.resumes || []).map((r: any) => ({
        id: r.id,

        fileName: r.fileName,

        storagePath:
          r.storagePath || 'database',

        fileSize: r.fileSize,

        mimeType: r.mimeType,

        version: r.version,

        isDefault: r.isDefault,

        status: r.status,

        atsAnalysis:
          r.atsAnalysis || null,

        publicUrl: `/admin/users/${user._id || user.email}/resume/download`,

        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),

      preferences:
        user.preferences || {},

      dashboardData:
        user.dashboardData || {
          currentPlan: 'Free',
          remainingCredits: {
            job: 10,
            ai: 5,
            resume: 3,
            ats: 5,
          },
          applicationsCount: 0,
          interviewCount: 0,
          offerCount: 0,
          jobsInProgress: 0,
          adminMessage: '',
        },

      notifications:
        user.notifications || [],

      subscriptionInfo:
        billing.subscriptionInfo,

      paymentInfo:
        billing.paymentInfo,

      adminNotes:
        user.adminNotes || '',

      isActive:
        user.isActive ?? true,

      isVerified:
        user.isVerified ?? false,

      createdAt:
        (user as any).createdAt,

      updatedAt:
        (user as any).updatedAt,

      lastLoginAt:
        user.lastLoginAt || null,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // RESUME DOWNLOAD
  // ──────────────────────────────────────────────────────────────────────────

  async getResumeDownload(
    userId: string,
    resumeId?: string,
  ) {
    const user = await this.userModel
      .findById(userId)
      .exec();

    if (!user) {
      throw new NotFoundException(
        `User "${userId}" not found`,
      );
    }

    const resumes: any[] =
      user.resumes || [];

    let resume = resumeId
      ? resumes.find(
          (r: any) => r.id === resumeId,
        )
      : null;

    if (!resume) {
      resume =
        resumes.find(
          (r: any) => r.isDefault,
        ) ||
        resumes[0];
    }

    if (!resume) {
      throw new NotFoundException(
        'Candidate has no uploaded resume',
      );
    }

    const buffer =
      this._extractResumeBuffer(resume);

    if (buffer && buffer.length > 0) {
      return {
        resume,
        buffer,
        filePath: null,
      };
    }

    throw new NotFoundException(
      'Resume file data is not available in the database. The user needs to re-upload their resume.',
    );
  }

  /**
   * Extract the actual Node.js Buffer from MongoDB/Mongoose
   * resume fileData.
   *
   * Supported formats:
   *
   * 1. Node.js Buffer
   * 2. BSON Binary containing Uint8Array
   * 3. BSON Binary containing ArrayBuffer
   * 4. JSON Buffer format
   * 5. Direct Uint8Array
   * 6. Direct ArrayBuffer
   * 7. String fallback
   */
  private _extractResumeBuffer(
    resume: any,
  ): Buffer | null {
    const raw: any =
      resume?.fileData;

    if (!raw) {
      return null;
    }

    // 1. Already a Node.js Buffer.
    if (Buffer.isBuffer(raw)) {
      return raw;
    }

    // 2. BSON Binary containing Uint8Array.
    if (
      raw.buffer instanceof Uint8Array
    ) {
      return Buffer.from(raw.buffer);
    }

    // 3. BSON Binary containing ArrayBuffer.
    //
    // Convert ArrayBuffer -> Uint8Array -> Buffer.
    // This avoids the TS2769 Buffer.from overload issue.
    if (
      raw.buffer instanceof ArrayBuffer
    ) {
      const uint8 =
        new Uint8Array(raw.buffer);

      return Buffer.from(uint8);
    }

    // 4. JSON serialized Buffer:
    //
    // {
    //   type: 'Buffer',
    //   data: [...]
    // }
    if (
      raw.data &&
      Array.isArray(raw.data)
    ) {
      return Buffer.from(raw.data);
    }

    // 5. Direct Uint8Array.
    if (
      raw instanceof Uint8Array
    ) {
      return Buffer.from(raw);
    }

    // 6. Direct ArrayBuffer.
    if (
      raw instanceof ArrayBuffer
    ) {
      const uint8 =
        new Uint8Array(raw);

      return Buffer.from(uint8);
    }

    // 7. String fallback.
    if (
      typeof raw === 'string'
    ) {
      return Buffer.from(
        raw,
        'binary',
      );
    }

    return null;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // UPDATE USER
  // ──────────────────────────────────────────────────────────────────────────

  async updateUser(
    id: string,
    data: Record<string, any>,
  ) {
    const user =
      await this.userModel
        .findById(id)
        .exec();

    if (!user) {
      throw new NotFoundException(
        `User with ID "${id}" not found`,
      );
    }

    this.assertNotProtectedAdmin(user);

    if (data.fullName !== undefined) {
      user.fullName =
        data.fullName.trim();
    }

    if (data.phone !== undefined) {
      user.phone =
        data.phone?.trim() ||
        undefined;
    }

    if (data.accountType !== undefined) {
      user.accountType =
        data.accountType;
    }

    if (data.role !== undefined) {
      user.role =
        data.role;
    }

    if (data.hasExperience !== undefined) {
      user.hasExperience =
        Boolean(data.hasExperience);
    }

    if (data.companyName !== undefined) {
      user.companyName =
        data.companyName?.trim() ||
        undefined;
    }

    if (data.roleDetails !== undefined) {
      user.roleDetails =
        data.roleDetails?.trim() ||
        undefined;
    }

    if (data.employmentTypes !== undefined) {
      user.employmentTypes =
        Array.isArray(
          data.employmentTypes,
        )
          ? data.employmentTypes
          : [];
    }

    if (
      data.expectedPackageFullTime !==
      undefined
    ) {
      user.expectedPackageFullTime =
        data.expectedPackageFullTime;
    }

    if (
      data.expectedPackagePartTime !==
      undefined
    ) {
      user.expectedPackagePartTime =
        data.expectedPackagePartTime;
    }

    if (
      data.expectedPackageInternship !==
      undefined
    ) {
      user.expectedPackageInternship =
        data.expectedPackageInternship;
    }

    if (
      data.lastMonthlyPackage !==
      undefined
    ) {
      user.lastMonthlyPackage =
        data.lastMonthlyPackage;
    }

    if (data.isActive !== undefined) {
      user.isActive =
        Boolean(data.isActive);
    }

    if (data.isVerified !== undefined) {
      user.isVerified =
        Boolean(data.isVerified);
    }

    if (data.adminNotes !== undefined) {
      user.adminNotes =
        data.adminNotes;
    }

    if (data.bio !== undefined) {
      user.bio =
        data.bio;
    }

    if (data.linkedinUrl !== undefined) {
      user.linkedinUrl =
        data.linkedinUrl;
    }

    if (data.githubUrl !== undefined) {
      user.githubUrl =
        data.githubUrl;
    }

    if (data.portfolioUrl !== undefined) {
      user.portfolioUrl =
        data.portfolioUrl;
    }

    if (
      data.newPassword &&
      data.newPassword.length >= 8
    ) {
      user.passwordHash =
        await bcrypt.hash(
          data.newPassword,
          12,
        );
    }

    await user.save();

    this.logger.log(
      `Admin updated user ${id}`,
    );

    return this.findOne(id);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // UPDATE DASHBOARD
  // ──────────────────────────────────────────────────────────────────────────

  async updateUserDashboard(
    id: string,
    dashboardData: UpdateUserDashboardDto,
  ) {
    const user =
      await this.userModel
        .findById(id)
        .exec();

    if (!user) {
      throw new NotFoundException(
        `User with ID "${id}" not found`,
      );
    }

    this.assertNotProtectedAdmin(user);

    const previousPlan =
      user.dashboardData?.currentPlan;

    const {
      dashboardMetrics,
      ...restDashboardData
    } = dashboardData;

    const safeDashboardData: Record<
      string,
      any
    > = restDashboardData;

    const currentMetrics =
      (user.dashboardData as any)
        ?.dashboardMetrics || {};

    if (
      dashboardMetrics !==
      undefined
    ) {
      if (
        !dashboardMetrics ||
        typeof dashboardMetrics !==
          'object' ||
        Array.isArray(
          dashboardMetrics,
        )
      ) {
        throw new BadRequestException(
          'dashboardMetrics must be an object',
        );
      }

      const allowedMetrics = [
        'applications',
        'responses',
        'interviews',
        'offers',
        'rejected',
        'shortlisted',
      ];

      const metricPatch: Record<
        string,
        string
      > = {};

      const requestedMetrics =
        dashboardMetrics as Record<
          string,
          unknown
        >;

      for (
        const key of allowedMetrics
      ) {
        if (
          requestedMetrics[key] !==
          undefined
        ) {
          const value =
            requestedMetrics[key];

          if (
            typeof value !==
              'string' &&
            typeof value !==
              'number'
          ) {
            throw new BadRequestException(
              `${key} must be text`,
            );
          }

          metricPatch[key] =
            String(value);
        }
      }

      safeDashboardData.dashboardMetrics =
        {
          ...currentMetrics,
          ...metricPatch,
        };
    }

    user.dashboardData = {
      ...(user.dashboardData || {}),
      ...safeDashboardData,
      updatedAt: new Date(),
    };

    // Sync subscription when admin assigns a plan.
    if (
      dashboardData.currentPlan &&
      dashboardData.currentPlan !==
        'Free'
    ) {
      try {
        const planSlug =
          String(
            dashboardData.currentPlan,
          ).toLowerCase();

        const plan =
          await this.planModel
            .findOne({
              $or: [
                { id: planSlug },
                {
                  name: new RegExp(
                    `^${dashboardData.currentPlan}$`,
                    'i',
                  ),
                },
              ],
            })
            .lean()
            .exec();

        const startDate =
          new Date();

        const expiresAt =
          new Date();

        expiresAt.setMonth(
          expiresAt.getMonth() + 1,
        );

        await this.subscriptionModel.updateMany(
          {
            userId: id,
            status: {
              $in: [
                'ACTIVE',
                'TRIAL',
              ],
            },
          },
          {
            $set: {
              status: 'CANCELLED',
              cancellationReason:
                'Admin plan update',
            },
          },
        );

        await this.subscriptionModel.create(
          {
            userId: id,
            planId: plan
              ? plan.id
              : planSlug,

            status: 'ACTIVE',

            startDate,
            expiresAt,

            autoRenew: true,

            remainingJobCredits:
              Number(
                dashboardData
                  .remainingCredits
                  ?.job ??
                  plan?.jobCredits ??
                  100,
              ),

            remainingAiCredits:
              Number(
                dashboardData
                  .remainingCredits
                  ?.ai ??
                  plan?.aiCredits ??
                  50,
              ),

            remainingResumeCredits:
              Number(
                dashboardData
                  .remainingCredits
                  ?.resume ??
                  plan?.resumeCredits ??
                  20,
              ),

            remainingAtsCredits:
              Number(
                dashboardData
                  .remainingCredits
                  ?.ats ??
                  plan?.atsCredits ??
                  50,
              ),
          } as any,
        );

        if (
          previousPlan !==
          dashboardData.currentPlan
        ) {
          user.notifications =
            user.notifications || [];

          user.notifications.unshift(
            {
              id: randomUUID(),
              title:
                'Subscription Plan Updated',
              message: `An administrator updated your active plan to ${dashboardData.currentPlan}.`,
              type: 'INFO',
              link: '/dashboard',
              read: false,
              createdAt: new Date(),
            } as any,
          );
        }
      } catch (err: any) {
        this.logger.warn(
          `Failed to sync subscription record: ${err.message}`,
        );
      }
    } else if (
      dashboardData.currentPlan ===
      'Free'
    ) {
      try {
        await this.subscriptionModel.updateMany(
          {
            userId: id,
            status: {
              $in: [
                'ACTIVE',
                'TRIAL',
              ],
            },
          },
          {
            $set: {
              status: 'CANCELLED',
              cancellationReason:
                'Set to Free by Admin',
            },
          },
        );
      } catch (err: any) {
        this.logger.warn(
          `Failed to cancel active subscriptions: ${err.message}`,
        );
      }
    }

    await user.save();

    this.logger.log(
      `Admin pushed dashboard update for user ${id}`,
    );

    return {
      success: true,
      message:
        'User dashboard and subscription updated successfully',
      dashboardData:
        user.dashboardData,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // NOTIFICATIONS
  // ──────────────────────────────────────────────────────────────────────────

  async sendUserNotification(
    userId: string,
    notification: {
      title: string;
      message: string;
      type?: string;
      link?: string;
    },
  ) {
    const user =
      await this.userModel
        .findById(userId)
        .exec();

    if (!user) {
      throw new NotFoundException(
        `User with ID "${userId}" not found`,
      );
    }

    this.assertNotProtectedAdmin(user);

    const newNotification = {
      id: randomUUID(),
      title: notification.title,
      message: notification.message,
      type:
        notification.type ||
        'INFO',
      link:
        notification.link ||
        null,
      read: false,
      createdAt: new Date(),
    };

    if (!user.notifications) {
      user.notifications = [];
    }

    user.notifications.unshift(
      newNotification,
    );

    await user.save();

    this.logger.log(
      `Sent notification to user ${userId}: "${notification.title}"`,
    );

    return {
      success: true,
      notification:
        newNotification,
    };
  }

  async broadcastNotification(
    notification: {
      title: string;
      message: string;
      type?: string;
      link?: string;
    },
  ) {
    const newNotification = {
      id: randomUUID(),
      title: notification.title,
      message: notification.message,
      type:
        notification.type ||
        'ANNOUNCEMENT',
      link:
        notification.link ||
        null,
      read: false,
      createdAt: new Date(),
    };

    const users =
      await this.userModel
        .find({
          isActive: true,
          email: {
            $ne: PROTECTED_ADMIN_EMAIL,
          },
        })
        .exec();

    for (const user of users) {
      user.notifications =
        user.notifications || [];

      user.notifications.unshift(
        newNotification,
      );

      await user.save();
    }

    return {
      success: true,
      message: `Broadcast sent to ${users.length} active users`,
      notification:
        newNotification,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DELETE USER
  // ──────────────────────────────────────────────────────────────────────────

  async deleteUser(id: string) {
    const user =
      await this.userModel
        .findById(id)
        .exec();

    if (!user) {
      throw new NotFoundException(
        `User with ID "${id}" not found`,
      );
    }

    this.assertNotProtectedAdmin(user);

    await user.deleteOne();

    return {
      success: true,
      message: `User ${id} deleted successfully`,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SEED ADMIN
  // ──────────────────────────────────────────────────────────────────────────

  async seedDefaultAdmin() {
    const email =
      'admin@applyone.co';

    const passwordHash =
      await bcrypt.hash(
        'Admin@ApplyOne2026!',
        12,
      );

    const existing =
      await this.userModel
        .findOne({ email })
        .exec();

    if (existing) {
      return {
        success: true,
        message:
          'Admin already exists',
        user: { email },
      };
    }

    await this.userModel.create({
      email,
      fullName:
        'ApplyOne Admin',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
      isVerified: true,
      accountType:
        'PROFESSIONAL',
    });

    return {
      success: true,
      message:
        'Default admin seeded',
      user: { email },
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // APPLICATION MANAGEMENT
  // ──────────────────────────────────────────────────────────────────────────

  async getApplications(
    userId: string,
    filters?: {
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const user =
      await this.userModel
        .findById(userId)
        .exec();

    if (!user) {
      throw new NotFoundException(
        `User "${userId}" not found`,
      );
    }

    let apps: any[] =
      (user.dashboardData as any)
        ?.applications || [];

    if (
      filters?.status &&
      filters.status !== 'ALL'
    ) {
      apps = apps.filter(
        (a: any) =>
          a.status ===
          filters.status,
      );
    }

    if (filters?.search) {
      const q =
        filters.search.toLowerCase();

      apps = apps.filter(
        (a: any) =>
          a.jobTitle
            ?.toLowerCase()
            .includes(q) ||
          a.company
            ?.toLowerCase()
            .includes(q) ||
          a.campaign
            ?.toLowerCase()
            .includes(q),
      );
    }

    apps = [...apps].sort(
      (a: any, b: any) =>
        new Date(
          b.updatedAt ||
            b.appliedDate ||
            b.createdAt,
        ).getTime() -
        new Date(
          a.updatedAt ||
            a.appliedDate ||
            a.createdAt,
        ).getTime(),
    );

    const page =
      filters?.page || 1;

    const limit =
      filters?.limit || 50;

    const total =
      apps.length;

    const items = apps.slice(
      (page - 1) * limit,
      page * limit,
    );

    return {
      items,

      meta: {
        total,
        page,
        limit,
        totalPages:
          Math.ceil(
            total / limit,
          ),
      },
    };
  }

  async createApplication(
    userId: string,
    data: {
      jobTitle: string;
      company: string;
      location?: string;
      jobType?: string;
      jobUrl?: string;
      jobReference?: string;
      salary?: string;
      status: string;
      appliedDate?: string;
      source?: string;
      campaign?: string;
      notes?: string;
      recruiterContact?: string;
    },
  ) {
    const user =
      await this.userModel
        .findById(userId)
        .exec();

    if (!user) {
      throw new NotFoundException(
        `User "${userId}" not found`,
      );
    }

    this.assertNotProtectedAdmin(user);

    if (!data.jobTitle?.trim()) {
      throw new BadRequestException(
        'Job title is required',
      );
    }

    if (!data.company?.trim()) {
      throw new BadRequestException(
        'Company is required',
      );
    }

    if (!data.status?.trim()) {
      throw new BadRequestException(
        'Status is required',
      );
    }

    this.assertValidApplicationStatus(
      data.status,
    );

    const app = {
      id: randomUUID(),

      jobTitle:
        data.jobTitle.trim(),

      company:
        data.company.trim(),

      location:
        data.location?.trim() ||
        '',

      jobType:
        data.jobType ||
        'Full-time',

      jobUrl:
        data.jobUrl?.trim() ||
        '',

      jobReference:
        data.jobReference?.trim() ||
        '',

      salary:
        data.salary?.trim() ||
        '',

      status:
        data.status,

      appliedDate:
        data.appliedDate ||
        new Date()
          .toISOString()
          .split('T')[0],

      source:
        data.source ||
        'ApplyOne',

      campaign:
        data.campaign?.trim() ||
        '',

      notes:
        data.notes?.trim() ||
        '',

      recruiterContact:
        data.recruiterContact?.trim() ||
        '',

      statusHistory: [
        {
          status: data.status,
          timestamp:
            new Date().toISOString(),
          note:
            'Application created by admin',
        },
      ],

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString(),
    };

    const dd: any =
      user.dashboardData || {};

    const applications: any[] =
      dd.applications || [];

    applications.unshift(app);

    user.dashboardData = {
      ...dd,
      applications,
      updatedAt: new Date(),
    };

    await user.save();

    this.logger.log(
      `Admin created application "${app.jobTitle}" at "${app.company}" for user ${userId}`,
    );

    return {
      success: true,
      application: app,
    };
  }

  async updateApplication(
    userId: string,
    appId: string,
    data: Partial<{
      jobTitle: string;
      company: string;
      location: string;
      jobType: string;
      jobUrl: string;
      jobReference: string;
      salary: string;
      status: string;
      appliedDate: string;
      source: string;
      campaign: string;
      notes: string;
      recruiterContact: string;
    }>,
  ) {
    const user =
      await this.userModel
        .findById(userId)
        .exec();

    if (!user) {
      throw new NotFoundException(
        `User "${userId}" not found`,
      );
    }

    this.assertNotProtectedAdmin(user);

    const dd: any =
      user.dashboardData || {};

    const applications: any[] =
      dd.applications || [];

    const idx =
      applications.findIndex(
        (a: any) =>
          a.id === appId,
      );

    if (idx === -1) {
      throw new NotFoundException(
        `Application "${appId}" not found`,
      );
    }

    const existing =
      applications[idx];

    if (data.status) {
      this.assertValidApplicationStatus(
        data.status,
      );
    }

    const updated = {
      ...existing,

      ...Object.fromEntries(
        Object.entries(data).filter(
          ([, v]) =>
            v !== undefined,
        ),
      ),

      updatedAt:
        new Date().toISOString(),
    };

    if (
      data.status &&
      data.status !==
        existing.status
    ) {
      updated.statusHistory = [
        ...(existing.statusHistory ||
          []),

        {
          status: data.status,

          timestamp:
            new Date().toISOString(),

          note: `Status changed from ${existing.status} to ${data.status} by admin`,
        },
      ];
    }

    applications[idx] =
      updated;

    user.dashboardData = {
      ...dd,
      applications,
      updatedAt: new Date(),
    };

    await user.save();

    this.logger.log(
      `Admin updated application ${appId} for user ${userId}`,
    );

    return {
      success: true,
      application: updated,
    };
  }

  async deleteApplication(
    userId: string,
    appId: string,
  ) {
    const user =
      await this.userModel
        .findById(userId)
        .exec();

    if (!user) {
      throw new NotFoundException(
        `User "${userId}" not found`,
      );
    }

    this.assertNotProtectedAdmin(user);

    const dd: any =
      user.dashboardData || {};

    const applications: any[] =
      dd.applications || [];

    const idx =
      applications.findIndex(
        (a: any) =>
          a.id === appId,
      );

    if (idx === -1) {
      throw new NotFoundException(
        `Application "${appId}" not found`,
      );
    }

    const archived = {
      ...applications[idx],

      status: 'Withdrawn',

      archivedAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString(),

      statusHistory: [
        ...(applications[idx]
          .statusHistory || []),

        {
          status:
            'Withdrawn',

          timestamp:
            new Date().toISOString(),

          note: `Archived by admin (previous status: ${applications[idx].status})`,
        },
      ],
    };

    applications[idx] =
      archived;

    user.dashboardData = {
      ...dd,
      applications,
      updatedAt: new Date(),
    };

    await user.save();

    this.logger.log(
      `Admin archived application ${appId} for user ${userId}`,
    );

    return {
      success: true,
      message:
        'Application archived',
    };
  }

  async bulkCreateApplications(
    userId: string,
    apps: any[],
  ) {
    const user =
      await this.userModel
        .findById(userId)
        .exec();

    if (!user) {
      throw new NotFoundException(
        `User "${userId}" not found`,
      );
    }

    this.assertNotProtectedAdmin(user);

    const dd: any =
      user.dashboardData || {};

    const existing: any[] =
      dd.applications || [];

    const created = apps
      .map((data: any) => ({
        id: randomUUID(),

        jobTitle: (
          data.jobTitle ||
          data['Job Title'] ||
          ''
        ).trim(),

        company: (
          data.company ||
          data['Company'] ||
          ''
        ).trim(),

        location: (
          data.location ||
          data['Location'] ||
          ''
        ).trim(),

        jobType:
          data.jobType ||
          data['Job Type'] ||
          'Full-time',

        jobUrl: (
          data.jobUrl ||
          data['Job URL'] ||
          ''
        ).trim(),

        jobReference: (
          data.jobReference ||
          data['Job Reference'] ||
          ''
        ).trim(),

        salary: (
          data.salary ||
          data['Salary'] ||
          ''
        ).trim(),

        status:
          data.status ||
          data['Status'] ||
          'Applied',

        appliedDate:
          data.appliedDate ||
          data['Applied Date'] ||
          new Date()
            .toISOString()
            .split('T')[0],

        source:
          data.source ||
          data['Source'] ||
          'ApplyOne',

        campaign: (
          data.campaign ||
          data['Campaign'] ||
          ''
        ).trim(),

        notes: (
          data.notes ||
          data['Notes'] ||
          ''
        ).trim(),

        recruiterContact: (
          data.recruiterContact ||
          data['Recruiter Contact'] ||
          ''
        ).trim(),

        statusHistory: [
          {
            status:
              data.status ||
              'Applied',

            timestamp:
              new Date().toISOString(),

            note:
              'Bulk import by admin',
          },
        ],

        createdAt:
          new Date().toISOString(),

        updatedAt:
          new Date().toISOString(),
      }))
      .filter(
        (a: any) =>
          a.jobTitle &&
          a.company,
      );

    created.forEach(
      (application: any) =>
        this.assertValidApplicationStatus(
          application.status,
        ),
    );

    const merged = [
      ...created,
      ...existing,
    ];

    user.dashboardData = {
      ...dd,
      applications: merged,
      updatedAt: new Date(),
    };

    await user.save();

    this.logger.log(
      `Admin bulk-imported ${created.length} applications for user ${userId}`,
    );

    return {
      success: true,
      created: created.length,
      skipped:
        apps.length -
        created.length,
    };
  }

  private assertValidApplicationStatus(
    status: string,
  ) {
    const allowed = [
      'Preparing',
      'Applied',
      'Under Review',
      'Shortlisted',
      'Interview Scheduled',
      'Interviewing',
      'Offer',
      'Accepted',
      'Rejected',
      'Withdrawn',
    ];

    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Invalid application status: ${status}`,
      );
    }
  }
}