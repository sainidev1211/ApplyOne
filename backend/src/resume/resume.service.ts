import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ActivityLoggerService } from '../common/services/activity-logger.service.js';
import { UpdateResumeDto } from './dto/update-resume.dto.js';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ResumeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogger: ActivityLoggerService,
    private readonly configService: ConfigService,
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
      throw new BadRequestException('Invalid file format. Only PDF and Word documents are allowed.');
    }

    // Determine new version
    const lastResume = await this.prisma.resume.findFirst({
      where: { userId },
      orderBy: { version: 'desc' },
    });
    
    const version = (lastResume?.version || 0) + 1;
    const isDefault = version === 1; // Make default if it's the first one

    // DB Transaction
    const resume = await this.prisma.$transaction(async (prisma: any) => {
      // If making default, unset others (handled implicitly if this is the first)
      if (isDefault) {
        await prisma.resume.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const storagePath = `uploads/${file.filename}`;

      return prisma.resume.create({
        data: {
          userId,
          fileName: file.originalname,
          storagePath,
          publicUrl: `/${storagePath}`, // Simple path mapping for now
          fileSize: file.size,
          mimeType: file.mimetype,
          version,
          isDefault,
          status: 'ACTIVE',
        },
      });
    });

    await this.activityLogger.log(userId, 'RESUME_UPLOADED', 'resume', `Uploaded resume version ${version}`);

    return resume;
  }

  async getAllResumes(userId: string) {
    return this.prisma.resume.findMany({
      where: { userId },
      orderBy: { version: 'desc' },
    });
  }

  async getResumeHistory(userId: string) {
    // Alias for getAllResumes in this case
    return this.getAllResumes(userId);
  }

  async updateResume(userId: string, id: string, dto: UpdateResumeDto) {
    const resume = await this.prisma.resume.findUnique({
      where: { id },
    });

    if (!resume || resume.userId !== userId) {
      throw new NotFoundException('Resume not found');
    }

    if (dto.isDefault) {
      await this.prisma.$transaction(async (prisma) => {
        // Unset current default
        await prisma.resume.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });

        // Set new default
        await prisma.resume.update({
          where: { id },
          data: { isDefault: true },
        });
      });
      
      await this.activityLogger.log(userId, 'RESUME_DEFAULT_SET', 'resume', `Set resume version ${resume.version} as default`);
    }

    return this.prisma.resume.findUnique({ where: { id } });
  }

  async deleteResume(userId: string, id: string) {
    const resume = await this.prisma.resume.findUnique({
      where: { id },
    });

    if (!resume || resume.userId !== userId) {
      throw new NotFoundException('Resume not found');
    }

    // Physical deletion
    const uploadDir = this.configService.get<string>('app.uploadPath', './uploads');
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
    await this.prisma.resume.delete({
      where: { id },
    });

    await this.activityLogger.log(userId, 'RESUME_DELETED', 'resume', `Deleted resume version ${resume.version}`);

    // If we deleted the default, set the newest remaining one as default
    if (resume.isDefault) {
      const newestRemaining = await this.prisma.resume.findFirst({
        where: { userId },
        orderBy: { version: 'desc' },
      });

      if (newestRemaining) {
        await this.prisma.resume.update({
          where: { id: newestRemaining.id },
          data: { isDefault: true },
        });
      }
    }

    return { message: 'Resume deleted successfully' };
  }
}
