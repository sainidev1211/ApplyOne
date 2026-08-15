import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export interface PrismaService extends PrismaClient {}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  constructor() {
    return new Proxy(this, {
      get(target, prop, receiver) {
        if (prop in target) {
          return Reflect.get(target, prop, receiver);
        }
        return createMockCollection();
      }
    });
  }

  async onModuleInit(): Promise<void> {}
  async onModuleDestroy(): Promise<void> {}
  async $connect(): Promise<void> {}
  async $disconnect(): Promise<void> {}

  $transaction: any = async (arg: any): Promise<any> => {
    if (typeof arg === 'function') {
      return arg(this);
    }
    return Array.isArray(arg) ? Promise.all(arg) : [];
  };
}

function createMockCollection(): any {
  const mockModel: any = {
    findUnique: async () => null,
    findFirst: async () => null,
    findMany: async () => [],
    create: async (args: any) => args?.data || {},
    update: async (args: any) => args?.data || {},
    upsert: async (args: any) => args?.update || args?.create || {},
    delete: async () => ({}),
    count: async () => 0,
    groupBy: async () => [],
    aggregate: async () => ({}),
    updateMany: async () => ({ count: 0 }),
    deleteMany: async () => ({ count: 0 }),
  };

  return new Proxy(mockModel, {
    get(target, prop, receiver) {
      if (prop in target) {
        return Reflect.get(target, prop, receiver);
      }
      return async () => null;
    }
  });
}
