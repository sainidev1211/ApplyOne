import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async getInvoices(userId: string) {
    return this.prisma.invoice.findMany({
      where: { userId },
      orderBy: { invoiceDate: 'desc' },
      include: {
        payment: { include: { subscription: { include: { plan: true } } } },
      },
    });
  }

  async getInvoiceById(userId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, userId },
      include: {
        payment: { include: { subscription: { include: { plan: true } } } },
        user: true,
      },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async getAllInvoices() {
    return this.prisma.invoice.findMany({
      orderBy: { invoiceDate: 'desc' },
      include: {
        user: true,
        payment: { include: { subscription: { include: { plan: true } } } },
      },
    });
  }
}
