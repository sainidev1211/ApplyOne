import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import * as fs from 'fs';
import { User, UserDocument } from '../users/schemas/user.schema.js';
import { LoginDto } from './dto/login.dto.js';
import { Role } from './enums/role.enum.js';
import { EmailService } from './email.service.js';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async signup(dto: Record<string, string>, file?: Express.Multer.File) {
    const email = dto.email?.trim().toLowerCase();
    if (!email || !dto.fullName?.trim() || !dto.password || !dto.confirmPassword) {
      throw new BadRequestException('Name, email, password, and password confirmation are required.');
    }
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match.');
    }
    if (
      dto.password.length < 8 ||
      !/[A-Z]/.test(dto.password) ||
      !/[a-z]/.test(dto.password) ||
      !/[0-9]/.test(dto.password)
    ) {
      throw new BadRequestException('Password must be at least 8 characters and include uppercase, lowercase, and a number.');
    }
    if (file && file.size > 10 * 1024 * 1024) {
      if (file.path && fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch {}
      }
      throw new BadRequestException('Resume file size exceeds the 10 MB limit.');
    }

    const existing = await this.userModel.findOne({ email }).exec();
    if (existing) {
      if (file?.path && fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch {}
      }
      throw new ConflictException('An account with this email already exists. Please sign in.');
    }

    let fileBuffer: Buffer | undefined;
    if (file) {
      if (file.buffer) {
        fileBuffer = file.buffer;
      } else if (file.path && fs.existsSync(file.path)) {
        fileBuffer = fs.readFileSync(file.path);
        try { fs.unlinkSync(file.path); } catch {}
      }
    }

    const employmentTypes = this.parseEmploymentTypes(dto.employmentTypesText || dto.employmentTypes);
    const resumeId = randomUUID();
    const initialResume = file && fileBuffer ? {
      id: resumeId,
      fileName: file.originalname,
      storagePath: 'database',
      fileData: fileBuffer,
      mimeType: file.mimetype,
      fileSize: file.size || fileBuffer.length,
      version: 1,
      isDefault: true,
      status: 'ACTIVE',
      publicUrl: `/resume/${resumeId}/download`,
      createdAt: new Date(),
      updatedAt: new Date(),
    } : undefined;

    const user = new this.userModel({
      _id: email,
      email,
      fullName: dto.fullName.trim(),
      phone: dto.phone?.trim() || undefined,
      accountType: dto.accountType || 'STUDENT',
      role: Role.USER,
      passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
      isActive: true,
      isVerified: true,
      profileCompleted: true,
      hasExperience: dto.hasExperience === 'true' || dto.hasExperience === '1',
      companyName: dto.companyName?.trim() || undefined,
      roleDetails: dto.roleDetails?.trim() || undefined,
      employmentTypes,
      lastMonthlyPackage: dto.lastMonthlyPackage || undefined,
      expectedPackageFullTime: dto.expectedPackageFullTime || undefined,
      expectedPackagePartTime: dto.expectedPackagePartTime || undefined,
      expectedPackageInternship: dto.expectedPackageInternship || undefined,
      resumeFileName: file?.originalname,
      resumePath: initialResume ? 'database' : undefined,
      resumes: initialResume ? [initialResume] : [],
    });
    await user.save();
    return this.createSession(user, false);
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    if (!user.passwordHash) {
      if (user.googleId) {
        throw new UnauthorizedException('This account was created with Google Sign-In. Please click "Continue with Google".');
      }
      throw new UnauthorizedException('Invalid email or password.');
    }
    if (!(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated.');
    }

    user.lastLoginAt = new Date();
    await user.save();
    const isProfileComplete = Boolean(user.profileCompleted) || (Boolean(user.phone) && Boolean(user.employmentTypes?.length));
    return this.createSession(user, !isProfileComplete);
  }

  async googleAuth(credential: string) {
    if (!credential) {
      throw new BadRequestException('Google credential token is required.');
    }

    let payload: any;
    try {
      const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
      const res = await fetch(verifyUrl);
      if (!res.ok) {
        throw new Error(`Google verify status ${res.status}`);
      }
      payload = await res.json();
    } catch (err: any) {
      this.logger.error(`Google token verification failed: ${err.message}`);
      throw new UnauthorizedException('Google authentication failed. Please try again.');
    }

    if (!payload || !payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid Google token data.');
    }

    const email = payload.email.trim().toLowerCase();
    const googleId = String(payload.sub);

    // Check for existing MongoDB user by googleId OR email
    let user = await this.userModel.findOne({
      $or: [{ googleId }, { email }],
    }).exec();

    let isNewUser = false;
    if (user) {
      // Safely link Google ID to existing account
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (!user.avatarUrl && payload.picture) {
        user.avatarUrl = payload.picture;
      }
      user.isVerified = true;
      user.lastLoginAt = new Date();
      await user.save();
    } else {
      isNewUser = true;
      user = new this.userModel({
        _id: email,
        email,
        fullName: payload.name || payload.given_name || 'ApplyOne Candidate',
        avatarUrl: payload.picture || undefined,
        googleId,
        authProvider: 'GOOGLE',
        role: Role.USER,
        accountType: 'STUDENT',
        isActive: true,
        isVerified: true,
        profileCompleted: false,
        employmentTypes: [],
        resumes: [],
        lastLoginAt: new Date(),
      });
      await user.save();
    }

    const isProfileComplete = Boolean(user.profileCompleted) || (Boolean(user.phone) && Boolean(user.employmentTypes?.length));
    return this.createSession(user, isNewUser ? true : !isProfileComplete);
  }

  async completeProfile(userId: string, dto: Record<string, any>, file?: Express.Multer.File) {
    const user = (await this.userModel.findById(userId).exec()) || (await this.userModel.findOne({ email: String(userId).toLowerCase() }).exec());
    if (!user) {
      throw new NotFoundException('User profile not found.');
    }

    if (dto.fullName?.trim()) user.fullName = dto.fullName.trim();
    if (dto.phone?.trim()) user.phone = dto.phone.trim();
    if (dto.accountType) user.accountType = dto.accountType;
    if (dto.hasExperience !== undefined) {
      user.hasExperience = dto.hasExperience === 'true' || dto.hasExperience === true || dto.hasExperience === '1';
    }
    if (dto.companyName?.trim()) user.companyName = dto.companyName.trim();
    if (dto.roleDetails?.trim()) user.roleDetails = dto.roleDetails.trim();
    if (dto.selectedEmploymentType) {
      user.employmentTypes = [dto.selectedEmploymentType];
    } else if (dto.employmentTypesText || dto.employmentTypes) {
      user.employmentTypes = this.parseEmploymentTypes(dto.employmentTypesText || dto.employmentTypes);
    }
    if (dto.expectedPackage) {
      if (dto.selectedEmploymentType === 'PART_TIME') user.expectedPackagePartTime = String(dto.expectedPackage);
      else if (dto.selectedEmploymentType === 'INTERNSHIP') user.expectedPackageInternship = String(dto.expectedPackage);
      else user.expectedPackageFullTime = String(dto.expectedPackage);
    }
    if (dto.lastMonthlyPackage) user.lastMonthlyPackage = String(dto.lastMonthlyPackage);

    if (file) {
      let fileBuffer: Buffer | undefined;
      if (file.buffer) {
        fileBuffer = file.buffer;
      } else if (file.path && fs.existsSync(file.path)) {
        fileBuffer = fs.readFileSync(file.path);
        try { fs.unlinkSync(file.path); } catch {}
      }

      if (fileBuffer) {
        const resumeId = randomUUID();
        const resumes: any[] = user.resumes || [];
        resumes.forEach((r) => { r.isDefault = false; r.status = 'ARCHIVED'; });
        resumes.push({
          id: resumeId,
          userId: user._id,
          fileName: file.originalname,
          storagePath: 'database',
          fileData: fileBuffer,
          mimeType: file.mimetype,
          fileSize: file.size || fileBuffer.length,
          version: (resumes.length || 0) + 1,
          isDefault: true,
          status: 'ACTIVE',
          publicUrl: `/resume/${resumeId}/download`,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        user.resumes = resumes;
        user.resumeFileName = file.originalname;
        user.resumePath = 'database';
      }
    }

    user.profileCompleted = true;
    await user.save();
    return this.createSession(user, false);
  }

  async forgotPassword(emailInput: string) {
    const email = emailInput?.trim().toLowerCase();
    if (!email) throw new BadRequestException('Email address is required.');

    const user = await this.userModel.findOne({ email }).exec();
    const genericResponse = {
      success: true,
      message: 'If an account exists with this email, a password recovery link has been sent.',
    };

    if (!user || !user.isActive) {
      return genericResponse;
    }

    // Google-only account check
    if (!user.passwordHash && user.googleId) {
      try {
        await this.emailService.sendGoogleAccountNoticeEmail(email, user.fullName);
      } catch (err: any) {
        this.logger.warn(`Could not send Google account notice: ${err.message}`);
      }
      return {
        ...genericResponse,
        isGoogleOnly: true,
      };
    }

    if (user.passwordHash) {
      const rawToken = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');
      user.resetPasswordTokenHash = tokenHash;
      user.resetPasswordExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      try {
        await this.emailService.sendPasswordResetEmail(email, rawToken, user.fullName);
      } catch (err: any) {
        this.logger.error(`Failed to send password reset email to ${email}: ${err.message}`);
      }
    }

    return genericResponse;
  }

  async resetPassword(token: string, newPassword: string) {
    if (!token || !newPassword) {
      throw new BadRequestException('Token and new password are required.');
    }
    if (
      newPassword.length < 8 ||
      !/[A-Z]/.test(newPassword) ||
      !/[a-z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword)
    ) {
      throw new BadRequestException(
        'Password must be at least 8 characters and include uppercase, lowercase, and a number.',
      );
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const user = await this.userModel.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: { $gt: new Date() },
    }).exec();

    if (!user) {
      throw new BadRequestException(
        'Password reset link is invalid or has expired. Please request a new link.',
      );
    }

    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();

    return {
      success: true,
      message: 'Your password has been reset successfully. Please sign in with your new password.',
    };
  }

  async logout(_token: string) {
    return { message: 'Logged out successfully.' };
  }

  async verifyEmail(_token: string) {
    return { message: 'Email/password accounts are active immediately.' };
  }

  async resendVerification(_email: string) {
    return { message: 'Email/password accounts are active immediately.' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user || !user.passwordHash || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect.');
    }
    if (newPassword.length < 8) throw new BadRequestException('New password must be at least 8 characters long.');
    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await user.save();
    return { message: 'Password updated successfully.' };
  }

  private parseEmploymentTypes(value?: any): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(String);
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch { /* plain text */ }
    return String(value).split(',').map((item) => item.trim()).filter(Boolean);
  }

  private createSession(user: UserDocument, needsProfileCompletion = false) {
    const id = String(user._id || user.email);
    const accessToken = this.jwtService.sign(
      { sub: id, email: user.email, role: user.role },
      { secret: this.config.get<string>('JWT_SECRET', 'change-this-development-secret'), expiresIn: '7d' },
    );
    this.logger.log(`Authenticated ${user.email} (needsProfileCompletion: ${needsProfileCompletion})`);
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 604800,
      needsProfileCompletion,
      user: {
        id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone || null,
        role: user.role || 'USER',
        accountType: user.accountType || 'STUDENT',
        avatarUrl: user.avatarUrl || null,
        profileCompleted: user.profileCompleted ?? false,
      },
    };
  }
}
