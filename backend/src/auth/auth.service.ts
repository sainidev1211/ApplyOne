import { Injectable, UnauthorizedException, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../database/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { Role } from './enums/role.enum.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private supabase: SupabaseClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL', '');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY', '');
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }

  async login(dto: LoginDto) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });
    
    if (error || !data.user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      tokenType: 'Bearer',
      expiresIn: data.session.expires_in,
      user: await this.mapUser(data.user.id, dto.email)
    };
  }

  async signup(dto: any) {
    const { data, error } = await this.supabase.auth.signUp({
      email: dto.email,
      password: dto.password,
    });
    
    if (error) {
      throw new BadRequestException(error.message);
    }
    
    // Create local user mapping
    if (data.user) {
      await this.mapUser(data.user.id, dto.email, dto.name);
    }
    
    return { message: 'Signup successful, please verify email' };
  }
  
  async logout(token: string) {
    const { error } = await this.supabase.auth.admin.signOut(token);
    if (error) throw new BadRequestException(error.message);
    return { message: 'Logged out successfully' };
  }

  private async mapUser(supabaseId: string, email: string, name = '') {
    // Upsert local DB record
    const user = await this.prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        id: supabaseId,
        email,
        fullName: name || 'User',
        role: Role.USER
      }
    });
    return user;
  }
}
