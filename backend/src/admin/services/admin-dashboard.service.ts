import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema.js';
import { Payment, PaymentDocument } from '../../payments/schemas/payment.schema.js';
import { Subscription, SubscriptionDocument } from '../../subscriptions/schemas/subscription.schema.js';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(Subscription.name) private readonly subscriptionModel: Model<SubscriptionDocument>,
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
      applicationUsers,
      activeSubscribers,
      revenue,
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
      this.userModel.find({}, { dashboardData: 1 }).lean().exec(),
      this.subscriptionModel.countDocuments({ status: 'ACTIVE', expiresAt: { $gt: new Date() } }).exec(),
      this.paymentModel.aggregate([
        { $match: { status: 'SUCCESS' } },
        { $group: { _id: null, amount: { $sum: '$amount' } } },
      ]).exec(),
    ]);

    const applicationRows = applicationUsers.flatMap((user: any) => user.dashboardData?.applications || []);
    const submittedStatuses = ['Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Interviewing', 'Offer', 'Accepted'];
    const interviews = ['Interview Scheduled', 'Interviewing'];
    const offers = ['Offer', 'Accepted'];

    return {
      overview: {
        totalUsers,
        activeUsers,
        totalAdmins,
        usersWithResumes,
        studentsCount,
        freshersCount,
        professionalsCount,
        activeSubscribers,
        applicationsSubmitted: applicationRows.filter((app: any) => submittedStatuses.includes(app.status)).length,
        interviews: applicationRows.filter((app: any) => interviews.includes(app.status)).length,
        offers: applicationRows.filter((app: any) => offers.includes(app.status)).length,
        totalRevenue: revenue[0]?.amount || 0,
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
