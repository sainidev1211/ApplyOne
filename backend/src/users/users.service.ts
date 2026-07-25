import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UpdatePreferencesDto } from './dto/update-preferences.dto.js';
import { PaginationQueryDto } from './dto/pagination-query.dto.js';
import { ActivityLoggerService } from '../common/services/activity-logger.service.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogger: ActivityLoggerService,
  ) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        accountType: true,
        hasExperience: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateMe(userId: string, data: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });
    
    await this.activityLogger.log(userId, 'USER_UPDATED', 'users', 'User core details updated');
    
    return user;
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const { completionPercentage, completedFields, missingFields, suggestions } = this.calculateProfileCompletion(user);

    return {
      ...user,
      completionPercentage,
      completedFields,
      missingFields,
      suggestions,
    };
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: data as Prisma.UserUpdateInput,
    });
    
    await this.activityLogger.log(userId, 'PROFILE_UPDATED', 'users', 'User profile updated');
    
    const completionData = this.calculateProfileCompletion(user);
    
    return {
      ...user,
      ...completionData
    };
  }

  async deleteAccount(userId: string) {
    // Soft delete user
    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false, deletedAt: new Date() },
    });
    
    await this.activityLogger.log(userId, 'ACCOUNT_DELETED', 'users', 'User account deactivated');
    
    return { message: 'Account successfully deactivated' };
  }

  async getDashboard(userId: string) {
    const [user, applications, activeResume, subscription] = await Promise.all([
      this.getMe(userId),
      this.prisma.application.findMany({
        where: { userId },
        include: { job: { include: { company: true } } },
        orderBy: { appliedAt: 'desc' },
        take: 5
      }),
      this.prisma.resume.findFirst({
        where: { userId, isDefault: true, status: 'ACTIVE' },
      }),
      this.prisma.subscription.findFirst({
        where: { userId, status: 'ACTIVE' },
        include: { plan: true }
      })
    ]);

    const stats = await this.prisma.application.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    });

    const applicationsCount = stats.reduce((acc: number, curr: any) => acc + curr._count, 0);
    const interviewCount = stats.find((s: any) => s.status === 'INTERVIEW')?._count || 0;
    const offerCount = stats.find((s: any) => s.status === 'OFFER')?._count || 0;
    const inProgressCount = applicationsCount - (stats.find((s: any) => s.status === 'REJECTED')?._count || 0) - offerCount;

    return {
      userInfo: user,
      currentPlan: subscription?.plan?.name || 'Free',
      remainingCredits: {
        job: subscription?.remainingJobCredits || 0,
        ai: subscription?.remainingAiCredits || 0,
        resume: subscription?.remainingResumeCredits || 0,
        ats: subscription?.remainingAtsCredits || 0,
      },
      resumeStatus: activeResume ? 'Active' : 'Missing',
      applicationsCount,
      interviewCount,
      offerCount,
      jobsInProgress: inProgressCount,
      recentActivity: applications,
      profileCompletion: this.calculateProfileCompletion(await this.prisma.user.findUnique({ where: { id: userId } }) as any).completionPercentage,
    };
  }

  async getActivity(userId: string, query: PaginationQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.activityLog.count({ where: { userId } }),
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

  async getPreferences(userId: string) {
    let prefs = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (!prefs) {
      prefs = await this.prisma.userPreferences.create({
        data: { userId },
      });
    }

    return prefs;
  }

  async updatePreferences(userId: string, data: UpdatePreferencesDto) {
    const prefs = await this.prisma.userPreferences.upsert({
      where: { userId },
      create: { userId, ...(data as any) },
      update: data as any,
    });

    await this.activityLogger.log(userId, 'PREFERENCES_UPDATED', 'users', 'User preferences updated');
    
    return prefs;
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    const avatarUrl = `/uploads/${file.filename}`;
    
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    await this.activityLogger.log(userId, 'AVATAR_UPDATED', 'users', 'User avatar updated');
    
    return { avatarUrl };
  }

  async deleteAvatar(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
    });
    
    await this.activityLogger.log(userId, 'AVATAR_DELETED', 'users', 'User avatar removed');
    
    return { message: 'Avatar deleted successfully' };
  }

  async getStatistics(userId: string) {
    const applications = await this.prisma.application.count({ where: { userId } });
    const interviews = await this.prisma.application.count({ where: { userId, status: 'INTERVIEW' } });
    const offers = await this.prisma.application.count({ where: { userId, status: 'OFFER' } });
    
    return { applications, interviews, offers };
  }

  private calculateProfileCompletion(user: any) {
    const fields = [
      { key: 'fullName', label: 'Full Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone Number' },
      { key: 'country', label: 'Country' },
      { key: 'city', label: 'City' },
      { key: 'bio', label: 'Bio' },
      { key: 'linkedinUrl', label: 'LinkedIn Profile' },
      { key: 'githubUrl', label: 'GitHub Profile' },
    ];

    if (user.hasExperience) {
      fields.push(
        { key: 'currentCompany', label: 'Current Company' },
        { key: 'currentPosition', label: 'Current Position' },
        { key: 'experienceYears', label: 'Years of Experience' }
      );
    }

    const completedFields: string[] = [];
    const missingFields: string[] = [];
    const suggestions: string[] = [];

    fields.forEach((field) => {
      if (user[field.key] !== null && user[field.key] !== undefined && user[field.key] !== '') {
        completedFields.push(field.label);
      } else {
        missingFields.push(field.label);
        suggestions.push(`Add your ${field.label.toLowerCase()} to improve your profile visibility.`);
      }
    });

    const completionPercentage = Math.round((completedFields.length / fields.length) * 100);

    return {
      completionPercentage,
      completedFields,
      missingFields,
      suggestions,
    };
  }
}
