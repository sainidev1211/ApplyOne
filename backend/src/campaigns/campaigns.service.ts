import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Campaign, CampaignDocument } from './schemas/campaign.schema.js';
import { User, UserDocument } from '../users/schemas/user.schema.js';

const STATES = ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'];
@Injectable()
export class CampaignsService {
  constructor(@InjectModel(Campaign.name) private readonly campaigns: Model<CampaignDocument>, @InjectModel(User.name) private readonly users: Model<UserDocument>) {}
  async list(query: any) { const page = Math.max(1, Number(query.page) || 1); const limit = Math.min(100, Math.max(1, Number(query.limit) || 20)); const filter: any = {}; if (query.status) filter.status = query.status; if (query.search) filter.name = new RegExp(query.search, 'i'); const [items,total] = await Promise.all([this.campaigns.find(filter).sort({ createdAt:-1 }).skip((page-1)*limit).limit(limit).lean(),this.campaigns.countDocuments(filter)]); return { items, meta:{ total,page,limit,totalPages:Math.ceil(total/limit) } }; }
  async create(data: any, adminId: string) { if (!data.name?.trim()) throw new BadRequestException('Campaign name is required'); if (data.status && !STATES.includes(data.status)) throw new BadRequestException('Invalid campaign status'); return this.campaigns.create({ ...data, name:data.name.trim(), userIds:[...new Set(data.userIds || [])], createdBy:adminId }); }
  async update(id:string,data:any) { if (data.status && !STATES.includes(data.status)) throw new BadRequestException('Invalid campaign status'); const campaign = await this.campaigns.findOneAndUpdate({ id }, { $set:{...data, ...(data.userIds && { userIds:[...new Set(data.userIds)] })} }, { new:true }).lean(); if (!campaign) throw new NotFoundException('Campaign not found'); return campaign; }
  async detail(id: string) { const campaign:any = await this.campaigns.findOne({ id }).lean(); if (!campaign) throw new NotFoundException('Campaign not found'); const users:any[] = await this.users.find({ _id:{ $in:campaign.userIds } }, { fullName:1,email:1,isActive:1,dashboardData:1 }).lean(); const applications = users.flatMap(user => (user.dashboardData?.applications || []).filter((app:any) => app.campaign === campaign.name).map((app:any) => ({ ...app, user:{ id:String(user._id), fullName:user.fullName, email:user.email, isActive:user.isActive } }))); const interview = ['Interview Scheduled','Interviewing']; const offer = ['Offer','Accepted']; return { ...campaign, users:users.map(user => ({ id:String(user._id),fullName:user.fullName,email:user.email,isActive:user.isActive })), applications, metrics:{ applications:applications.length, interviews:applications.filter((a:any)=>interview.includes(a.status)).length, offers:applications.filter((a:any)=>offer.includes(a.status)).length } }; }
}
