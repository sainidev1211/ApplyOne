import { BadRequestException, ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema.js';
import { LoginDto } from './dto/login.dto.js';
import { Role } from './enums/role.enum.js';
import { randomUUID } from 'crypto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
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
      throw new BadRequestException('Resume file size exceeds the 10 MB limit.');
    }

    const existing = await this.userModel.findOne({ email }).exec();
    if (existing) throw new ConflictException('An account with this email already exists.');

    const employmentTypes = this.parseEmploymentTypes(dto.employmentTypesText);
    const initialResume = file ? {
      id: randomUUID(), fileName: file.originalname, resumePath: `uploads/${file.filename}`,
      storagePath: `uploads/${file.filename}`, mimeType: file.mimetype, fileSize: file.size,
      version: 1, isDefault: true, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date(),
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
      hasExperience: dto.hasExperience === 'true',
      companyName: dto.companyName?.trim() || undefined,
      roleDetails: dto.roleDetails?.trim() || undefined,
      employmentTypes,
      lastMonthlyPackage: dto.lastMonthlyPackage || undefined,
      expectedPackageFullTime: dto.expectedPackageFullTime || undefined,
      expectedPackagePartTime: dto.expectedPackagePartTime || undefined,
      expectedPackageInternship: dto.expectedPackageInternship || undefined,
      resumeFileName: file?.originalname,
      resumePath: file ? `uploads/${file.filename}` : undefined,
      resumes: initialResume ? [initialResume] : [],
    });
    await user.save();
    return this.createSession(user);
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.userModel.findById(email).exec();
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password.');
    } else if (!(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password.');
    } else if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated.');
    }

    user.lastLoginAt = new Date();
    await user.save();
    return this.createSession(user);
  }

  async startGoogleSignup(dto: Record<string, string>, file?: Express.Multer.File) {
    const email = dto.email?.trim().toLowerCase();
    if (!email || !dto.fullName?.trim()) throw new BadRequestException('Name and email are required before continuing with Google.');
    if (file && file.size > 10 * 1024 * 1024) throw new BadRequestException('Resume file size exceeds the 10 MB limit.');
    const existing = await this.userModel.findOne({ email }).exec();
    if (existing && !existing.googleOnboardingPending) throw new ConflictException('An account with this email already exists. Use Google sign-in or email/password sign-in.');
    const resume = file ? { id: randomUUID(), fileName: file.originalname, storagePath: `uploads/${file.filename}`, mimeType: file.mimetype, fileSize: file.size, version: 1, isDefault: true, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() } : undefined;
    const data: any = {
      _id: email, email, fullName: dto.fullName.trim(), phone: dto.phone?.trim() || undefined, accountType: dto.accountType || 'STUDENT', role: Role.USER,
      hasExperience: dto.hasExperience === 'true', companyName: dto.companyName?.trim() || undefined, roleDetails: dto.roleDetails?.trim() || undefined,
      employmentTypes: this.parseEmploymentTypes(dto.employmentTypesText), lastMonthlyPackage: dto.lastMonthlyPackage || undefined,
      expectedPackageFullTime: dto.expectedPackageFullTime || undefined, expectedPackagePartTime: dto.expectedPackagePartTime || undefined,
      expectedPackageInternship: dto.expectedPackageInternship || undefined, authProvider: 'GOOGLE', googleOnboardingPending: true,
      resumeFileName: file?.originalname, resumePath: file ? `uploads/${file.filename}` : undefined, resumes: resume ? [resume] : [],
    };
    if (existing) await this.userModel.updateOne({ _id: existing._id }, { $set: data }).exec();
    else await new this.userModel(data).save();
    // Google signup removed — return a placeholder or instruct frontend to proceed with normal signup
    return { message: 'Google signup disabled on this server.' } as any;
  }

  async logout(_token: string) { return { message: 'Logged out successfully.' }; }

  async verifyEmail(_token: string) { return { message: 'Email/password accounts are active immediately.' }; }
  async resendVerification(_email: string) { return { message: 'Email/password accounts are active immediately.' }; }
  async forgotPassword(_email: string) { return { message: 'Password recovery is not configured yet.' }; }
  async resetPassword(_token: string, _newPassword: string) { return { message: 'Password recovery is not configured yet.' }; }

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

  private parseEmploymentTypes(value?: string): string[] {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch { /* plain text is supported */ }
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }

  private googleAuthorizationUrl(email: string, flow: 'signup' | 'login') {
    throw new BadRequestException('Google login disabled on this server.');
  }

  private googleRedirectUri() {
    const backendPublicUrl = this.config.get<string>('BACKEND_PUBLIC_URL');
    if (!backendPublicUrl) {
      throw new Error(
        'BACKEND_PUBLIC_URL is not defined. Set the environment variable BACKEND_PUBLIC_URL for OAuth redirects to work correctly.',
      );
    }
    return `${backendPublicUrl}/api/v1/auth/google/callback`;
  }

  private createSession(user: UserDocument) {
    const id = String(user._id);
    const accessToken = this.jwtService.sign(
      { sub: id, email: user.email, role: user.role },
      { secret: this.config.get<string>('JWT_SECRET', 'change-this-development-secret'), expiresIn: '7d' },
    );
    this.logger.log(`Authenticated ${user.email}`);
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 604800,
      user: { id, email: user.email, fullName: user.fullName, phone: user.phone || null, role: user.role, accountType: user.accountType, avatarUrl: user.avatarUrl || null },
    };
  }
}
