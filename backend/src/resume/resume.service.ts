import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UpdateResumeDto } from './dto/update-resume.dto.js';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { User, UserDocument } from '../users/schemas/user.schema.js';

@Injectable()
export class ResumeService {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async uploadResume(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is missing');
    }

    // Only allow pdf/doc/docx (enforced partly by Multer, double checking here)
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      // Remove the uploaded file if it failed validation here
      fs.unlinkSync(file.path);
      throw new BadRequestException(
        'Invalid file format. Only PDF and Word documents are allowed.',
      );
    }

    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');
    const resumes: any[] = user.resumes || [];
    const version = Math.max(0, ...resumes.map((item) => item.version || 0)) + 1;
    // Uploading is a replacement: only one current resume is used by ATS.
    resumes.forEach((item) => { item.isDefault = false; item.status = 'ARCHIVED'; });
    const resume = { id: randomUUID(), userId, fileName: file.originalname, storagePath: `uploads/${file.filename}`,
      publicUrl: '', fileSize: file.size, mimeType: file.mimetype, version,
      isDefault: true, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() };
    // Use one stable id in metadata and URL.
    resume.publicUrl = `/resume/${resume.id}/download`;
    resumes.push(resume);
    user.resumes = resumes as any;
    user.resumeFileName = file.originalname;
    user.resumePath = resume.storagePath;
    await user.save();
    return resume;
  }

  async getAllResumes(userId: string) {
    const user = await this.userModel.findById(userId).lean().exec();
    return (user?.resumes || []).map((resume: any) => ({ ...resume, userId, publicUrl: `/resume/${resume.id}/download` })).sort((a: any, b: any) => b.version - a.version);
  }

  async getResumeHistory(userId: string) {
    // Alias for getAllResumes in this case
    return this.getAllResumes(userId);
  }

  async updateResume(userId: string, id: string, dto: UpdateResumeDto) {
    const user = await this.userModel.findById(userId).exec();
    const resume: any = user?.resumes?.find((item: any) => item.id === id);
    if (!user || !resume) throw new NotFoundException('Resume not found');
    if (dto.isDefault) user.resumes.forEach((item: any) => { item.isDefault = item.id === id; });
    await user.save();
    return { ...(resume.toObject?.() || resume), userId, publicUrl: `/resume/${id}/download` };
  }

  async deleteResume(userId: string, id: string) {
    const user = await this.userModel.findById(userId).exec();
    const resume: any = user?.resumes?.find((item: any) => item.id === id);
    if (!user || !resume) throw new NotFoundException('Resume not found');

    // Physical deletion
    const uploadDir = this.configService.get<string>(
      'app.uploadPath',
      './uploads',
    );
    const filename = path.basename(resume.storagePath);
    const fullPath = path.join(uploadDir, filename);

    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (error) {
      console.error(`Failed to delete file ${fullPath}`, error);
      // We continue with DB deletion even if file deletion fails
    }

    // DB deletion
    user.resumes = user.resumes.filter((item: any) => item.id !== id) as any;
    const remaining: any[] = user.resumes || [];
    if (resume.isDefault && remaining.length) remaining.sort((a, b) => b.version - a.version)[0].isDefault = true;
    const current: any = remaining.find((item) => item.isDefault);
    user.resumeFileName = current?.fileName;
    user.resumePath = current?.storagePath;
    await user.save();

    return { message: 'Resume deleted successfully' };
  }

  async getDownload(userId: string, id: string) {
    const user = await this.userModel.findById(userId).lean().exec();
    const resume: any = user?.resumes?.find((item: any) => item.id === id);
    if (!resume) throw new NotFoundException('Resume not found');
    const uploadDir = this.configService.get<string>('app.uploadPath', './uploads');
    const filePath = path.join(uploadDir, path.basename(resume.storagePath));
    if (!fs.existsSync(filePath)) throw new NotFoundException('Resume file is unavailable');
    return { resume, filePath };
  }
}
