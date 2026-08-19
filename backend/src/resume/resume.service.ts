import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { UpdateResumeDto } from './dto/update-resume.dto.js';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { User, UserDocument } from '../users/schemas/user.schema.js';

@Injectable()
export class ResumeService {
  private readonly logger = new Logger(ResumeService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  // ──────────────────────────────────────────────────────────────────────────
  // UPLOAD
  // ──────────────────────────────────────────────────────────────────────────

  async uploadResume(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is missing');
    }

    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file format. Only PDF and Word documents are allowed.',
      );
    }

    // memoryStorage provides file.buffer directly — no disk I/O required.
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Uploaded file buffer is empty.');
    }

    const fileBuffer: Buffer = file.buffer;

    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    const resumes: any[] = user.resumes || [];
    const version = Math.max(0, ...resumes.map((item) => item.version || 0)) + 1;

    // Archive previous resumes
    resumes.forEach((item) => {
      item.isDefault = false;
      item.status = 'ARCHIVED';
    });

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
    user.resumePath = 'database';

    await user.save();

    this.logger.log(`Resume uploaded for user ${userId}: ${file.originalname} (${fileBuffer.length} bytes)`);

    // Return clean metadata — never send the binary buffer in the JSON response
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

  // ──────────────────────────────────────────────────────────────────────────
  // LIST
  // ──────────────────────────────────────────────────────────────────────────

  async getAllResumes(userId: string) {
    // Use select to explicitly EXCLUDE the large fileData binary blob
    const user = await this.userModel
      .findById(userId)
      .select('-resumes.fileData')
      .lean()
      .exec();

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

  // ──────────────────────────────────────────────────────────────────────────
  // UPDATE
  // ──────────────────────────────────────────────────────────────────────────

  async updateResume(userId: string, id: string, dto: UpdateResumeDto) {
    const user = await this.userModel.findById(userId).exec();
    const resume: any = user?.resumes?.find((item: any) => item.id === id);
    if (!user || !resume) throw new NotFoundException('Resume not found');

    if (dto.isDefault) {
      user.resumes.forEach((item: any) => {
        item.isDefault = item.id === id;
      });
    }

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

  // ──────────────────────────────────────────────────────────────────────────
  // DELETE
  // ──────────────────────────────────────────────────────────────────────────

  async deleteResume(userId: string, id: string) {
    const user = await this.userModel.findById(userId).exec();
    const resume: any = user?.resumes?.find((item: any) => item.id === id);
    if (!user || !resume) throw new NotFoundException('Resume not found');

    user.resumes = user.resumes.filter((item: any) => item.id !== id) as any;
    const remaining: any[] = user.resumes || [];

    if (resume.isDefault && remaining.length) {
      remaining.sort((a, b) => b.version - a.version)[0].isDefault = true;
    }

    const current: any = remaining.find((item) => item.isDefault);
    user.resumeFileName = current?.fileName;
    user.resumePath = current ? 'database' : undefined;

    await user.save();
    return { message: 'Resume deleted successfully' };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DOWNLOAD (user-scoped)
  // ──────────────────────────────────────────────────────────────────────────

  async getDownload(userId: string, id: string): Promise<{ resume: any; buffer: Buffer; filePath: null }> {
    // Fetch the specific user document with fileData included for this lookup
    const user = await this.userModel.findById(userId).exec();
    const resume: any = user?.resumes?.find((item: any) => item.id === id);
    if (!resume) throw new NotFoundException('Resume not found');

    const buffer = this._extractBuffer(resume);
    if (!buffer) {
      throw new NotFoundException('Resume file data is not available. Please re-upload the resume.');
    }

    return { resume, buffer, filePath: null };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DOWNLOAD (admin-scoped — looks up by userId, not the requester's own ID)
  // ──────────────────────────────────────────────────────────────────────────

  async getAdminDownload(targetUserId: string, resumeId: string): Promise<{ resume: any; buffer: Buffer; filePath: null }> {
    const user = await this.userModel.findById(targetUserId).exec();
    const resume: any = user?.resumes?.find((item: any) => item.id === resumeId);
    if (!resume) throw new NotFoundException('Resume not found');

    const buffer = this._extractBuffer(resume);
    if (!buffer) {
      throw new NotFoundException('Resume file data is not available. Please ask the user to re-upload.');
    }

    return { resume, buffer, filePath: null };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * MongoDB stores Buffer data as BSON Binary. When retrieved via Mongoose the
   * shape can be one of:
   *   - A Node.js Buffer (ideal)
   *   - A BSON Binary object with a `.buffer` Uint8Array inside
   *   - A plain object with `.data` array (lean() / JSON round-trip)
   */
  private _extractBuffer(resume: any): Buffer | null {
    const raw = resume.fileData;
    if (!raw) return null;

    if (Buffer.isBuffer(raw)) return raw;

    // BSON Binary (Mongoose returns this for Buffer fields)
    if (raw.buffer instanceof Uint8Array || raw.buffer instanceof ArrayBuffer) {
      return Buffer.from(raw.buffer);
    }

    // Lean / JSON serialized form: { type: 'Buffer', data: [...] }
    if (raw.data && Array.isArray(raw.data)) {
      return Buffer.from(raw.data);
    }

    // Uint8Array / ArrayBuffer directly
    if (raw instanceof Uint8Array || raw instanceof ArrayBuffer) {
      return Buffer.from(raw);
    }

    // Last resort: try to interpret as binary string or base64
    if (typeof raw === 'string') {
      return Buffer.from(raw, 'binary');
    }

    return null;
  }
}
