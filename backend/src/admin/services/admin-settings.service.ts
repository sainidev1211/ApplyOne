import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { UpdateSettingsDto } from '../dto/admin.dto.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllSettings() {
    const settings = await this.prisma.systemSettings.findMany();
    return settings.reduce(
      (acc, curr) => {
        acc[curr.key] = JSON.parse(curr.value);
        return acc;
      },
      {} as Record<string, any>,
    );
  }

  async updateSettings(adminId: string, dto: UpdateSettingsDto) {
    const keys = Object.keys(dto);
    const updates = [];

    for (const key of keys) {
      const val = (dto as any)[key];
      if (val !== undefined) {
        updates.push(
          this.prisma.systemSettings.upsert({
            where: { key },
            update: { value: JSON.stringify(val) },
            create: { key, value: JSON.stringify(val) },
          }),
        );
      }
    }

    await Promise.all(updates);

    await this.prisma.auditLog.create({
      data: {
        adminId,
        module: 'SETTINGS',
        action: 'UPDATE_SYSTEM_SETTINGS',
        newValue: dto as unknown as Prisma.InputJsonValue,
      },
    });

    return this.getAllSettings();
  }
}
