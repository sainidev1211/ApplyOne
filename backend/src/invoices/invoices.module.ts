import { PrismaService } from '../database/prisma.service.js';
import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller.js';
import { InvoicesService } from './invoices.service.js';

@Module({
  controllers: [InvoicesController],
  providers: [PrismaService, InvoicesService]
})
export class InvoicesModule {}
