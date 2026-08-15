import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { PrismaService } from '../database/prisma.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UpdatePreferencesDto } from './dto/update-preferences.dto.js';
import { PaginationQueryDto } from './dto/pagination-query.dto.js';
import { ActivityLoggerService } from '../common/services/activity-logger.service.js';
import { User, UserDocument } from './schemas/user.schema.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogger: ActivityLoggerService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async getMe(userId: string) {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      accountType: user.accountType,
      hasExperience: user.hasExperience,
      isActive: user.isActive,
      isVerified: user.isVerified,
      resumeFileName: user.resumeFileName,
      createdAt: (user as any).createdAt,
      updatedAt: (user as any).updatedAt,
    };
  }

  async updateMe(userId: string, data: UpdateUserDto) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (data.email) user.email = data.email;
    if (data.fullName) user.fullName = data.fullName;
    await user.save();

    await this.activityLogger.log(
      userId,
      'USER_UPDATED',
      'users',
      'User core details updated',
    );

    return {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
    };
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const userObj = user.toObject();
    (userObj as any).id = user._id.toString();

    const {
      completionPercentage,
      completedFields,
      missingFields,
      suggestions,
    } = this.calculateProfileCompletion(userObj);

    return {
      ...userObj,
      completionPercentage,
      completedFields,
      missingFields,
      suggestions,
    };
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    Object.assign(user, data);
    await user.save();

    await this.activityLogger.log(
      userId,
      'PROFILE_UPDATED',
      'users',
      'User profile updated',
    );

    const userObj = user.toObject();
    (userObj as any).id = user._id.toString();
    const completionData = this.calculateProfileCompletion(userObj);

    return {
      ...userObj,
      ...completionData,
    };
  }

  async deleteAccount(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (user) {
      user.isActive = false;
      await user.save();
    }

    await this.activityLogger.log(
      userId,
      'ACCOUNT_DELETED',
      'users',
      'User account deactivated',
    );

    return { message: 'Account successfully deactivated' };
  }

  async getDashboard(userId: string) {
    const user = await this.getMe(userId);
    const mUser = await this.userModel.findById(userId).exec();
    const resumeStatus = mUser && mUser.resumeFileName ? 'Active' : 'Missing';
    const activeResume =
      mUser && mUser.resumeFileName
        ? {
            id: 'resume-1',
            userId,
            fileName: mUser.resumeFileName,
            storagePath: mUser.resumePath || '',
            fileSize: 1000,
            mimeType: 'application/pdf',
            version: 1,
            isDefault: true,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
          }
        : null;

    const dbData = (mUser as any)?.dashboardData || {};
    const notifications = (mUser as any)?.notifications || [];

    return {
      userInfo: user,
      currentPlan: dbData.currentPlan || 'Free',
      remainingCredits: dbData.remainingCredits || {
        job: 10,
        ai: 5,
        resume: 3,
        ats: 5,
      },
      resumeStatus,
      activeResume,
      applicationsCount: dbData.applicationsCount ?? 0,
      interviewCount: dbData.interviewCount ?? 0,
      offerCount: dbData.offerCount ?? 0,
      jobsInProgress: dbData.jobsInProgress ?? 0,
      adminMessage: dbData.adminMessage || '',
      recentActivity: dbData.recentActivity || [],
      notifications,
      profileCompletion: this.calculateProfileCompletion(
        mUser ? mUser.toObject() : {},
      ).completionPercentage,
    };
  }

  async getActivity(userId: string, query: PaginationQueryDto) {
    return {
      items: [],
      meta: {
        total: 0,
        page: query.page || 1,
        limit: query.limit || 10,
        totalPages: 0,
      },
    };
  }

  async getPreferences(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');
    const saved = user.preferences || {};
    return {
      id: 'prefs-1',
      userId,
      preferredRoles: [],
      preferredLocations: [],
      preferredIndustries: [],
      preferredCompanySize: [],
      openToRemote: true,
      openToHybrid: true,
      openToOnsite: true,
      employmentTypes: user?.employmentTypes || [],
      minimumSalary: user?.expectedPackageFullTime || null,
      maximumSalary: null,
      salaryCurrency: 'INR',
      visaSponsorshipNeeded: false,
      automationEnabled: saved.automationEnabled ?? true,
      dailyEmailAlerts: saved.dailyEmailAlerts ?? true,
      applicationAlerts: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async updatePreferences(userId: string, data: UpdatePreferencesDto) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');
    if (data.employmentTypes) user.employmentTypes = data.employmentTypes;
    user.preferences = { ...(user.preferences || {}), ...data };
    await user.save();
    return { ...(user.preferences || {}), employmentTypes: user.employmentTypes };
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    const avatarUrl = `/uploads/${file.filename}`;
    const user = await this.userModel.findById(userId).exec();
    if (user) {
      user.avatarUrl = avatarUrl;
      await user.save();
    }

    await this.activityLogger.log(
      userId,
      'AVATAR_UPDATED',
      'users',
      'User avatar updated',
    );

    return { avatarUrl };
  }

  async deleteAvatar(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (user) {
      user.avatarUrl = undefined;
      await user.save();
    }

    await this.activityLogger.log(
      userId,
      'AVATAR_DELETED',
      'users',
      'User avatar removed',
    );

    return { message: 'Avatar deleted successfully' };
  }

  async getStatistics(userId: string) {
    return { applications: 0, interviews: 0, offers: 0 };
  }

  private calculateProfileCompletion(user: any) {
    const fields = [
      { key: 'fullName', label: 'Full Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone Number' },
    ];

    if (user.hasExperience) {
      fields.push(
        { key: 'companyName', label: 'Company Name' },
        { key: 'roleDetails', label: 'Role Details' },
      );
    }

    const completedFields: string[] = [];
    const missingFields: string[] = [];
    const suggestions: string[] = [];

    fields.forEach((field) => {
      if (
        user[field.key] !== null &&
        user[field.key] !== undefined &&
        user[field.key] !== ''
      ) {
        completedFields.push(field.label);
      } else {
        missingFields.push(field.label);
        suggestions.push(
          `Add your ${field.label.toLowerCase()} to improve your profile visibility.`,
        );
      }
    });

    const completionPercentage = Math.round(
      (completedFields.length / fields.length) * 100,
    );

    return {
      completionPercentage,
      completedFields,
      missingFields,
      suggestions,
    };
  }
}
