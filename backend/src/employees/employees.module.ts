import { PrismaService } from '../database/prisma.service.js';
import { Module } from '@nestjs/common';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';

@Module({
  controllers: [EmployeesController],
  providers: [PrismaService, EmployeesService]
})
export class EmployeesModule {}
