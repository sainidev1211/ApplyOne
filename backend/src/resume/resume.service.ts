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
      if (file.path && fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch {}
      }
      throw new BadRequestException(
        'Invalid file format. Only PDF and Word documents are allowed.',
      );
    }

    // Read the binary file data into a Buffer to store in the database
    let fileBuffer: Buffer;
    if (file.buffer) {
      fileBuffer = file.buffer;
    } else if (file.path && fs.existsSync(file.path)) {
      fileBuffer = fs.readFileSync(file.path);
      try { fs.unlinkSync(file.path); } catch {}
    } else {
      throw new BadRequestException('Unable to read uploaded file buffer.');
    }

    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');
    const resumes: any[] = user.resumes || [];
    const version = Math.max(0, ...resumes.map((item) => item.version || 0)) + 1;
    // Uploading is a replacement: only one current resume is used by ATS.
    resumes.forEach((item) => { item.isDefault = false; item.status = 'ARCHIVED'; });
    
    const resume = {
      id: randomUUID(),
      userId,
      fileName: file.originalname,
      storagePath: 'database',
      fileData: fileBuffer,
      publicUrl: '',
      fileSize: file.size || fileBuffer.length,
      mimeType: file.mimetype,
      version,
      isDefault: true,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    resume.publicUrl = `/resume/${resume.id}/download`;
    resumes.push(resume);
    user.resumes = resumes as any;
    user.resumeFileName = file.originalname;
    user.resumePath = resume.storagePath;
    await user.save();

    // Return clean metadata without the large binary buffer in JSON
    return {
      id: resume.id,
      userId,
      fileName: resume.fileName,
      storagePath: resume.storagePath,
      fileSize: resume.fileSize,
      mimeType: resume.mimeType,
      version: resume.version,
      isDefault: resume.isDefault,
      status: resume.status,
      publicUrl: resume.publicUrl,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
    };
  }

  async getAllResumes(userId: string) {
    const user = await this.userModel.findById(userId).lean().exec();
    return (user?.resumes || [])
      .map((resume: any) => ({
        id: resume.id,
        userId,
        fileName: resume.fileName,
        storagePath: resume.storagePath || 'database',
        fileSize: resume.fileSize,
        mimeType: resume.mimeType,
        version: resume.version || 1,
        isDefault: Boolean(resume.isDefault),
        status: resume.status || 'ACTIVE',
        atsAnalysis: resume.atsAnalysis || null,
        publicUrl: `/resume/${resume.id}/download`,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
      }))
      .sort((a: any, b: any) => b.version - a.version);
  }

  async getResumeHistory(userId: string) {
    return this.getAllResumes(userId);
  }

  async updateResume(userId: string, id: string, dto: UpdateResumeDto) {
    const user = await this.userModel.findById(userId).exec();
    const resume: any = user?.resumes?.find((item: any) => item.id === id);
    if (!user || !resume) throw new NotFoundException('Resume not found');
    if (dto.isDefault) user.resumes.forEach((item: any) => { item.isDefault = item.id === id; });
    await user.save();
    return {
      id: resume.id,
      userId,
      fileName: resume.fileName,
      storagePath: resume.storagePath || 'database',
      fileSize: resume.fileSize,
      mimeType: resume.mimeType,
      version: resume.version,
      isDefault: resume.isDefault,
      status: resume.status,
      atsAnalysis: resume.atsAnalysis || null,
      publicUrl: `/resume/${id}/download`,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
    };
  }

  async deleteResume(userId: string, id: string) {
    const user = await this.userModel.findById(userId).exec();
    const resume: any = user?.resumes?.find((item: any) => item.id === id);
    if (!user || !resume) throw new NotFoundException('Resume not found');

    // Physical deletion if legacy file on disk
    if (resume.storagePath && resume.storagePath !== 'database') {
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
        console.error(`Failed to delete legacy file ${fullPath}`, error);
      }
    }

    // DB deletion
    user.resumes = user.resumes.filter((item: any) => item.id !== id) as any;
    const remaining: any[] = user.resumes || [];
    if (resume.isDefault && remaining.length) remaining.sort((a, b) => b.version - a.version)[0].isDefault = true;
    const current: any = remaining.find((item) => item.isDefault);
    user.resumeFileName = current?.fileName;
    user.resumePath = current?.storagePath || (current ? 'database' : undefined);
    await user.save();

    return { message: 'Resume deleted successfully' };
  }

  async getDownload(userId: string, id: string) {
    const user = await this.userModel.findById(userId).lean().exec();
    const resume: any = user?.resumes?.find((item: any) => item.id === id);
    if (!resume) throw new NotFoundException('Resume not found');

    // 1. Return buffer stored directly in database
    if (resume.fileData) {
      const buffer = Buffer.isBuffer(resume.fileData)
        ? resume.fileData
        : Buffer.from(resume.fileData.buffer || resume.fileData);
      return { resume, buffer, filePath: null };
    }

    // 2. Legacy fallback: check disk if storagePath exists
    if (resume.storagePath && resume.storagePath !== 'database') {
      const uploadDir = this.configService.get<string>('app.uploadPath', './uploads');
      const filePath = path.join(uploadDir, path.basename(resume.storagePath));
      if (fs.existsSync(filePath)) {
        return { resume, buffer: null, filePath };
      }
    }

    throw new NotFoundException('Resume file is unavailable');
  }
}
