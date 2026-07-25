import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'Get invoices for logged-in user' })
  getInvoices(@Request() req: any) {
    return this.invoicesService.getInvoices(req.user.id);
  }

  @Get('all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get all invoices' })
  getAllInvoices() {
    return this.invoicesService.getAllInvoices();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific invoice details' })
  getInvoiceById(@Request() req: any, @Param('id') id: string) {
    return this.invoicesService.getInvoiceById(req.user.id, id);
  }
}
