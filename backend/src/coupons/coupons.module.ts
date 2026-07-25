import { PrismaService } from '../database/prisma.service.js';
import { Module } from '@nestjs/common';
import { CouponsController } from './coupons.controller.js';
import { CouponsService } from './coupons.service.js';

@Module({
  controllers: [CouponsController],
  providers: [PrismaService, CouponsService]
})
export class CouponsModule {}
