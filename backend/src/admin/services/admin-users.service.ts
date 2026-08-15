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
import { PaginationQueryDto } from '../../users/dto/pagination-query.dto.js';
import { randomUUID } from 'crypto';

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

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

    const formattedItems = items.map((u: any) => ({
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
      notificationsCount: u.notifications?.length || 0,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      lastLoginAt: u.lastLoginAt || null,
    }));

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

    const result = await this.userModel.updateMany(
      { isActive: true },
      { $push: { notifications: { $each: [newNotification], $position: 0 } } },
    ).exec();

    this.logger.log(`Broadcast notification sent to ${result.modifiedCount} users.`);
    return {
      success: true,
      message: `Notification broadcasted to ${result.modifiedCount} users`,
      notification: newNotification,
    };
  }

  async deleteUser(id: string) {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return { success: true, message: `User ${id} permanently deleted` };
  }

  async seedDefaultAdmin() {
    const adminEmail = 'admin@applyone.co';
    const existing = await this.userModel.findById(adminEmail).exec();

    if (!existing) {
      const passwordHash = await bcrypt.hash('Admin@ApplyOne2026!', 12);
      const admin = new this.userModel({
        _id: adminEmail,
        email: adminEmail,
        fullName: 'ApplyOne Executive Admin',
        role: 'ADMIN',
        accountType: 'PROFESSIONAL',
        passwordHash,
        isActive: true,
        isVerified: true,
        createdAt: new Date(),
      });
      await admin.save();
      this.logger.log(`Default admin account created: ${adminEmail}`);
      return { created: true, email: adminEmail };
    } else if (existing.role !== 'ADMIN') {
      existing.role = 'ADMIN';
      await existing.save();
      return { updated: true, email: adminEmail };
    }

    return { exists: true, email: adminEmail };
  }
}
