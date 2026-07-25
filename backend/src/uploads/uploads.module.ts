import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uploadPath = configService.get<string>('app.uploadPath', './uploads');
        const maxSizeMb = configService.get<number>('app.maxUploadSizeMb', 10);

        // Ensure upload directory exists
        mkdirSync(uploadPath, { recursive: true });

        return {
          storage: diskStorage({
            destination: (_req, _file, callback) => {
              callback(null, uploadPath);
            },
            filename: (_req, file, callback) => {
              const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
              const ext = extname(file.originalname);
              callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
            },
          }),
          limits: {
            fileSize: maxSizeMb * 1024 * 1024,
          },
          fileFilter: (
            _req,
            file: Express.Multer.File,
            callback: (error: Error | null, acceptFile: boolean) => void,
          ) => {
            const allowedMimeTypes = [
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'image/jpeg',
              'image/png',
              'image/webp',
            ];

            if (allowedMimeTypes.includes(file.mimetype)) {
              callback(null, true);
            } else {
              callback(
                new Error(`Unsupported file type: ${file.mimetype}`),
                false,
              );
            }
          },
        };
      },
    }),
  ],
  exports: [MulterModule],
})
export class UploadsModule {}
