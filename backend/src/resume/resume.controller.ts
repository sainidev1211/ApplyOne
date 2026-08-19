import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
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
  @ApiOperation({ summary: 'Upload a new resume (PDF or Word). File stored in MongoDB as binary.' })
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
  @ApiOperation({ summary: 'Get all resumes (metadata only, no binary data) for the authenticated user' })
  async getAllResumes(@Request() req: any) {
    return this.resumeService.getAllResumes(req.user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get resume version history' })
  async getResumeHistory(@Request() req: any) {
    return this.resumeService.getResumeHistory(req.user.id);
  }

  /**
   * Download endpoint — triggers browser "Save As" dialog.
   * ?inline=true → shows PDF in browser tab instead of downloading.
   */
  @Get(':id/download')
  @ApiOperation({ summary: 'Download or view a resume file stored in MongoDB' })
  async downloadResume(
    @Request() req: any,
    @Param('id') id: string,
    @Query('inline') inline: string,
    @Res() res: Response,
  ) {
    const { resume, buffer } = await this.resumeService.getDownload(req.user.id, id);

    const contentDisposition =
      inline === 'true' || inline === '1'
        ? `inline; filename="${encodeURIComponent(resume.fileName || 'resume.pdf')}"`
        : `attachment; filename="${encodeURIComponent(resume.fileName || 'resume.pdf')}"`;

    res.setHeader('Content-Type', resume.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', contentDisposition);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-store');
    return res.send(buffer);
  }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Set a resume as the default' })
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
