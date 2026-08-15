import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema.js';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async getDashboardMetrics() {
    const [
      totalUsers,
      activeUsers,
      totalAdmins,
      studentsCount,
      freshersCount,
      professionalsCount,
      usersWithResumes,
      recentUsers,
    ] = await Promise.all([
      this.userModel.countDocuments().exec(),
      this.userModel.countDocuments({ isActive: true }).exec(),
      this.userModel.countDocuments({ role: 'ADMIN' }).exec(),
      this.userModel.countDocuments({ accountType: 'STUDENT' }).exec(),
      this.userModel.countDocuments({ accountType: 'FRESHER' }).exec(),
      this.userModel.countDocuments({ accountType: 'PROFESSIONAL' }).exec(),
      this.userModel.countDocuments({
        $or: [
          { resumeFileName: { $exists: true, $ne: '' } },
          { 'resumes.0': { $exists: true } },
        ],
      }).exec(),
      this.userModel
        .find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('_id email fullName phone accountType role resumeFileName createdAt isActive')
        .lean()
        .exec(),
    ]);

    return {
      overview: {
        totalUsers,
        activeUsers,
        totalAdmins,
        usersWithResumes,
        studentsCount,
        freshersCount,
        professionalsCount,
      },
      recentUsers: recentUsers.map((u: any) => ({
        id: u._id || u.email,
        email: u.email,
        fullName: u.fullName,
        phone: u.phone || null,
        accountType: u.accountType,
        role: u.role,
        hasResume: Boolean(u.resumeFileName),
        resumeFileName: u.resumeFileName || null,
        createdAt: u.createdAt,
        isActive: u.isActive ?? true,
      })),
    };
  }
}
