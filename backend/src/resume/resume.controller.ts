import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { ResumeService } from './resume.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UpdateResumeDto } from './dto/update-resume.dto.js';

@ApiTags('Resume')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('resume')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a new resume version' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('resume'))
  async uploadResume(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.resumeService.uploadResume(req.user.id, file);
  }

  @Get()
  @ApiOperation({ summary: 'Get all resumes for user' })
  async getAllResumes(@Request() req: any) {
    return this.resumeService.getAllResumes(req.user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get resume version history' })
  async getResumeHistory(@Request() req: any) {
    return this.resumeService.getResumeHistory(req.user.id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download the authenticated user resume' })
  async downloadResume(@Request() req: any, @Param('id') id: string, @Res() res: Response) {
    const { resume, buffer, filePath } = await this.resumeService.getDownload(req.user.id, id);
    res.setHeader('Content-Type', resume.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(resume.fileName || 'resume.pdf')}"`);
    if (buffer) {
      return res.send(buffer);
    }
    if (filePath) {
      return res.sendFile(filePath, { root: process.cwd() });
    }
    return res.status(404).send('Resume file is unavailable');
  }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Set resume as default' })
  async setDefaultResume(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateResumeDto: UpdateResumeDto,
  ) {
    return this.resumeService.updateResume(req.user.id, id, {
      ...updateResumeDto,
      isDefault: true,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a resume' })
  async deleteResume(@Request() req: any, @Param('id') id: string) {
    return this.resumeService.deleteResume(req.user.id, id);
  }
}
