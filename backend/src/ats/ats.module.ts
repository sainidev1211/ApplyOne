import { Module } from '@nestjs/common';
import { AtsController } from './ats.controller.js';
import { AtsService } from './ats.service.js';
import { AiModule } from '../ai/ai.module.js';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema.js';

@Module({
  imports: [AiModule, MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [AtsController],
  providers: [AtsService],
})
export class AtsModule {}
