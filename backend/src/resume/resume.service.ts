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
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
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

    // memoryStorage provides file.buffer directly.
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Uploaded file buffer is empty.');
    }

    const fileBuffer: Buffer = file.buffer;

    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resumes: any[] = user.resumes || [];

    const version =
      Math.max(
        0,
        ...resumes.map((item: any) => Number(item.version) || 0),
      ) + 1;

    // Archive previous resumes.
    resumes.forEach((item: any) => {
      item.isDefault = false;
      item.status = 'ARCHIVED';
    });

    // Store the actual uploaded file binary in MongoDB.
    const resume = {
      id: randomUUID(),
      userId,
      fileName: file.originalname,

      // Indicates that the actual file is stored in MongoDB.
      storagePath: 'database',

      // Actual PDF/DOC/DOCX binary.
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

    this.logger.log(
      `Resume uploaded for user ${userId}: ${file.originalname} (${fileBuffer.length} bytes)`,
    );

    // Never return the binary fileData in the JSON response.
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
    // Exclude the large binary fileData field from the list response.
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
      .sort(
        (a: any, b: any) =>
          Number(b.version || 0) - Number(a.version || 0),
      );
  }

  async getResumeHistory(userId: string) {
    return this.getAllResumes(userId);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // UPDATE
  // ──────────────────────────────────────────────────────────────────────────

  async updateResume(
    userId: string,
    id: string,
    dto: UpdateResumeDto,
  ) {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resume: any = user.resumes?.find(
      (item: any) => item.id === id,
    );

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

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

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resume: any = user.resumes?.find(
      (item: any) => item.id === id,
    );

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    user.resumes = user.resumes.filter(
      (item: any) => item.id !== id,
    ) as any;

    const remaining: any[] = user.resumes || [];

    // If the deleted resume was the default,
    // make the newest remaining resume default.
    if (resume.isDefault && remaining.length > 0) {
      remaining.sort(
        (a: any, b: any) =>
          Number(b.version || 0) - Number(a.version || 0),
      )[0].isDefault = true;
    }

    const current: any = remaining.find(
      (item: any) => item.isDefault,
    );

    user.resumeFileName = current?.fileName;
    user.resumePath = current ? 'database' : undefined;

    await user.save();

    return {
      message: 'Resume deleted successfully',
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DOWNLOAD - USER SCOPED
  // ──────────────────────────────────────────────────────────────────────────

  async getDownload(
    userId: string,
    id: string,
  ): Promise<{
    resume: any;
    buffer: Buffer;
    filePath: null;
  }> {
    // Do NOT exclude fileData here.
    // We need the actual binary to download the resume.
    const user = await this.userModel
      .findById(userId)
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resume: any = user.resumes?.find(
      (item: any) => item.id === id,
    );

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    const buffer = this._extractBuffer(resume);

    if (!buffer || buffer.length === 0) {
      throw new NotFoundException(
        'Resume file data is not available. Please re-upload the resume.',
      );
    }

    return {
      resume,
      buffer,
      filePath: null,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DOWNLOAD - ADMIN SCOPED
  // ──────────────────────────────────────────────────────────────────────────

  async getAdminDownload(
    targetUserId: string,
    resumeId: string,
  ): Promise<{
    resume: any;
    buffer: Buffer;
    filePath: null;
  }> {
    const user = await this.userModel
      .findById(targetUserId)
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resume: any = user.resumes?.find(
      (item: any) => item.id === resumeId,
    );

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    const buffer = this._extractBuffer(resume);

    if (!buffer || buffer.length === 0) {
      throw new NotFoundException(
        'Resume file data is not available. Please ask the user to re-upload the resume.',
      );
    }

    return {
      resume,
      buffer,
      filePath: null,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // BUFFER HELPER
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Extract the actual file Buffer from MongoDB/Mongoose data.
   *
   * Depending on how Mongoose/BSON returns the Buffer, fileData can appear as:
   *
   * 1. Node.js Buffer
   * 2. BSON Binary
   * 3. Uint8Array
   * 4. ArrayBuffer
   * 5. JSON Buffer format:
   *    { type: 'Buffer', data: [...] }
   * 6. Binary/base64 string
   */
  private _extractBuffer(resume: any): Buffer | null {
    if (!resume) {
      return null;
    }

    const raw: any = resume.fileData;

    if (!raw) {
      return null;
    }

    // ────────────────────────────────────────────────────────────────────────
    // 1. Already a Node.js Buffer
    // ────────────────────────────────────────────────────────────────────────

    if (Buffer.isBuffer(raw)) {
      return raw;
    }

    // ────────────────────────────────────────────────────────────────────────
    // 2. BSON Binary / object containing a Uint8Array
    // ────────────────────────────────────────────────────────────────────────

    if (raw.buffer instanceof Uint8Array) {
      return Buffer.from(raw.buffer);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 3. BSON/Node object containing an ArrayBuffer
    //
    // Convert it to Uint8Array first.
    // This avoids the TypeScript Buffer.from overload problem.
    // ────────────────────────────────────────────────────────────────────────

    if (raw.buffer instanceof ArrayBuffer) {
      const uint8 = new Uint8Array(raw.buffer);
      return Buffer.from(uint8);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 4. JSON serialized Buffer
    // { type: 'Buffer', data: [...] }
    // ────────────────────────────────────────────────────────────────────────

    if (
      raw.data &&
      Array.isArray(raw.data)
    ) {
      return Buffer.from(raw.data);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 5. Direct Uint8Array
    // ────────────────────────────────────────────────────────────────────────

    if (raw instanceof Uint8Array) {
      return Buffer.from(raw);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 6. Direct ArrayBuffer
    // ────────────────────────────────────────────────────────────────────────

    if (raw instanceof ArrayBuffer) {
      const uint8 = new Uint8Array(raw);
      return Buffer.from(uint8);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 7. String fallback
    // ────────────────────────────────────────────────────────────────────────

    if (typeof raw === 'string') {
      return Buffer.from(raw, 'binary');
    }

    // Nothing usable found.
    return null;
  }
}